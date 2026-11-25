import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  createRateLimiter,
  extractJsonBlock,
  formatApiError,
  isSafeHttpUrl,
  sanitizeAirBriefContext,
  sanitizeChatMessages,
  sanitizeCityInput,
  sanitizeHouseholdProfile,
  validateCoordinates,
} from './serverHelpers.ts';
import {
  PLAYBOOK_RESPONSE_SCHEMA,
  RESOLVE_CITY_SCHEMA,
  buildAdvisorSystemInstruction,
  buildAirBriefPrompt,
  buildPlaybookPrompt,
  type SanitizedImpactSummary,
} from './serverPrompts.ts';

export const MODEL_ID = 'gemini-4-hydrogen';

export interface AiClientLike {
  models: {
    generateContent: (params: Record<string, unknown>) => Promise<{
      text?: string;
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
        };
      }>;
    }>;
    generateContentStream: (
      params: Record<string, unknown>,
    ) => Promise<AsyncIterable<{ text?: string }>>;
  };
}

export interface CreateAppOptions {
  aiClientFactory?: () => AiClientLike;
  rateLimitMaxRequests?: number;
  rateLimitWindowMs?: number;
}

export function createDefaultAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeImpactSummary(raw: unknown): SanitizedImpactSummary {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const baselineIndoor = Number(record.baselineIndoorPm25);
  const mitigatedIndoor = Number(record.mitigatedIndoorPm25);
  const dropPct = Number(record.indoorDropPct);
  const avoidedGrams = Number(record.weeklyPm25AvoidedGrams);

  return {
    baselineIndoorPm25: Number.isFinite(baselineIndoor) ? baselineIndoor : null,
    mitigatedIndoorPm25: Number.isFinite(mitigatedIndoor) ? mitigatedIndoor : null,
    indoorDropPct: Number.isFinite(dropPct) ? Math.max(0, Math.min(100, Math.round(dropPct))) : 0,
    weeklyPm25AvoidedGrams: Number.isFinite(avoidedGrams) ? Math.max(0, avoidedGrams) : 0,
  };
}

/**
 * Builds and configures the Express application with hardened security headers,
 * API rate limiting, strict input sanitization, and Gemini server-side endpoints.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const getAiClient =
    options.aiClientFactory ?? (() => createDefaultAiClient() as unknown as AiClientLike);

  const limiter = createRateLimiter({
    windowMs: options.rateLimitWindowMs ?? 60_000,
    maxRequests: options.rateLimitMaxRequests ?? 40,
  });

  const app = express();
  app.disable('x-powered-by');

  // Hardened HTTP security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(express.json({ limit: '512kb' }));

  // Sliding-window rate limit for all API routes
  app.use('/api', (req, res, next) => {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const check = limiter.check(clientKey);
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));
    if (!check.allowed) {
      res.setHeader('Retry-After', String(check.retryAfterSeconds));
      res.status(429).json({
        error: 'Too many requests. Please wait a few seconds before trying again.',
      });
      return;
    }
    next();
  });

  // 1. Live Grounded Local Winter Smog & Air Quality Brief
  app.post('/api/air-brief', async (req: Request, res: Response) => {
    let input;
    try {
      input = sanitizeCityInput(req.body?.city, req.body?.regionContext);
    } catch (validationErr) {
      res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid city input.',
      });
      return;
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: buildAirBriefPrompt(input),
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = extractJsonBlock(response.text ?? '') as Record<string, unknown>;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const citations = chunks
        .map((chunk) => ({
          title: chunk.web?.title || 'Web source',
          url: chunk.web?.uri || '',
        }))
        .filter((c) => Boolean(c.url) && isSafeHttpUrl(c.url))
        .slice(0, 5);

      const severityRaw = String(parsed.severityLevel || 'Moderate');
      const severityLevel =
        severityRaw === 'Nominal' ||
        severityRaw === 'Moderate' ||
        severityRaw === 'Unhealthy' ||
        severityRaw === 'Severe'
          ? severityRaw
          : 'Moderate';

      res.json({
        city: String(parsed.city || input.city),
        estimatedAqi: Number(parsed.estimatedAqi) || 110,
        pm25UgM3: Number(parsed.pm25UgM3) || 38.5,
        severityLevel,
        inversionWindow: String(parsed.inversionWindow || '06:30 – 10:30 & 18:00 – 22:30'),
        bestVentilationWindow: String(
          parsed.bestVentilationWindow || '13:00 – 15:30 (afternoon mixing)',
        ),
        primaryPollutants: String(parsed.primaryPollutants || 'PM2.5, combustion NOx'),
        advisorySummary: String(
          parsed.advisorySummary ||
            'Winter boundary conditions are trapping urban fine particulates near ground level.',
        ),
        localTriggers: Array.isArray(parsed.localTriggers)
          ? parsed.localTriggers.map(String).slice(0, 3)
          : [
              'Morning cold-start commuter traffic',
              'Residential heating emissions under calm winter air',
            ],
        citations,
        fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLiveGrounded: true,
      });
    } catch (err) {
      console.error('Error in /api/air-brief:', err);
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 2. Resolve Coordinates -> City/Region
  app.post('/api/resolve-city', async (req: Request, res: Response) => {
    let coords;
    try {
      coords = validateCoordinates(req.body?.latitude, req.body?.longitude);
    } catch (validationErr) {
      res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid coordinates.',
      });
      return;
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Identify the city and region/country for coordinates latitude ${coords.latitude}, longitude ${coords.longitude}, and briefly note its winter air/topography context in 10 words or fewer.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESOLVE_CITY_SCHEMA,
        },
      });
      const data = JSON.parse((response.text ?? '{}').trim()) as Record<string, unknown>;
      res.json({
        city: String(data.city || ''),
        regionContext: String(data.regionContext || ''),
      });
    } catch (err) {
      console.error('Error in /api/resolve-city:', err);
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 3. Tailored Daily Playbook Generator (Routines, IAQ Hacks, Sustainable Swaps)
  app.post('/api/playbook', async (req: Request, res: Response) => {
    let cleanProfile;
    try {
      cleanProfile = sanitizeHouseholdProfile(req.body?.profile, true);
    } catch {
      res.status(400).json({ error: 'Household profile with city is required.' });
      return;
    }

    try {
      const cleanBrief = sanitizeAirBriefContext(req.body?.airBrief);
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: buildPlaybookPrompt(cleanProfile, cleanBrief),
        config: {
          systemInstruction:
            'You are VinterKlar, an environmental health and urban air-quality engineer advising families during severe winter smog. Be specific, practical, empathetic, and quantitative. Avoid generic platitudes.',
          responseMimeType: 'application/json',
          responseSchema: PLAYBOOK_RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        headlineInsight?: string;
        recommendations?: unknown[];
      };

      res.json({
        city: cleanProfile.city,
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        headlineInsight:
          parsed.headlineInsight ||
          'Prioritize indoor filtration during peak inversion hours and shift short cold-start trips.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      });
    } catch (err) {
      console.error('Error in /api/playbook:', err);
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 4. Contextual Streaming Clean-Air Advisor Chat (SSE)
  app.post('/api/advisor/chat', async (req: Request, res: Response) => {
    let cleanMessages;
    try {
      cleanMessages = sanitizeChatMessages(req.body?.messages);
    } catch (validationErr) {
      res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid messages.',
      });
      return;
    }

    try {
      const cleanProfile = sanitizeHouseholdProfile(req.body?.profile, false);
      const cleanBrief = sanitizeAirBriefContext(req.body?.airBrief);
      const cleanImpact = sanitizeImpactSummary(req.body?.impactSummary);
      const ai = getAiClient();

      const systemInstruction = buildAdvisorSystemInstruction(
        cleanProfile,
        cleanBrief,
        cleanImpact,
      );

      const contents = cleanMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ai.models.generateContentStream({
        model: MODEL_ID,
        contents,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('Error in /api/advisor/chat:', err);
      const { status, message } = formatApiError(err);
      if (!res.headersSent) {
        res.status(status).json({ error: message });
        return;
      }
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  });

  // Return clean JSON errors for malformed JSON payloads instead of HTML stack traces
  const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Malformed JSON request body.' });
      return;
    }
    next(err);
  };
  app.use(jsonErrorHandler);

  return app;
}
