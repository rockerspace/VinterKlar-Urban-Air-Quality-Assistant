import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  extractJsonBlock,
  formatApiError,
  isSafeHttpUrl,
  sanitizeChatMessages,
  sanitizeCityInput,
  validateCoordinates,
} from './serverHelpers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_ID = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
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

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Hardened HTTP security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });

  // 1. Live Grounded Local Winter Smog & Air Quality Brief
  app.post('/api/air-brief', async (req, res) => {
    let input;
    try {
      input = sanitizeCityInput(req.body?.city, req.body?.regionContext);
    } catch (validationErr) {
      return res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid city input.',
      });
    }

    try {
      const ai = getAiClient();
      const prompt = `Look up the latest current or typical winter air quality, PM2.5 levels, AQI, thermal inversion or winter smog advisories, and primary local pollution drivers for "${input.city}"${input.regionContext ? ` (${input.regionContext})` : ''}.

Respond ONLY with a valid JSON object inside \`\`\`json ... \`\`\` fences matching this exact schema:
{
  "city": "Normalized City, Region/Country",
  "estimatedAqi": number (0-500 integer reflecting current or winter smog episode conditions),
  "pm25UgM3": number (one decimal place in ug/m3),
  "severityLevel": "Nominal" | "Moderate" | "Unhealthy" | "Severe",
  "inversionWindow": "string describing typical peak smog/inversion hours e.g. 06:00 - 11:00 & 18:00 - 22:00",
  "bestVentilationWindow": "string describing safest afternoon airing/outdoor window",
  "primaryPollutants": "comma-separated primary local pollutants (e.g. PM2.5, woodsmoke, vehicle NOx)",
  "advisorySummary": "2 concise plain-English sentences explaining today's local smog situation and immediate family priority",
  "localTriggers": ["3 short specific local pollution triggers for this city"]
}`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text ?? '';
      const parsed = extractJsonBlock(rawText) as Record<string, unknown>;

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

      return res.json({
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
      const { status, message } = formatApiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 2. Resolve Coordinates -> City/Region
  app.post('/api/resolve-city', async (req, res) => {
    let coords;
    try {
      coords = validateCoordinates(req.body?.latitude, req.body?.longitude);
    } catch (validationErr) {
      return res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid coordinates.',
      });
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Identify the city and region/country for coordinates latitude ${coords.latitude}, longitude ${coords.longitude}, and briefly note its winter air/topography context in 10 words or fewer.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING, description: 'City, State or Country' },
              regionContext: { type: Type.STRING, description: 'Brief winter topography context' },
            },
            required: ['city', 'regionContext'],
          },
        },
      });
      const data = JSON.parse((response.text ?? '{}').trim());
      return res.json(data);
    } catch (err) {
      const { status, message } = formatApiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 3. Tailored Daily Playbook Generator (Routines, IAQ Hacks, Sustainable Swaps)
  app.post('/api/playbook', async (req, res) => {
    const { profile, airBrief } = req.body ?? {};
    let cleanCityInput;
    try {
      cleanCityInput = sanitizeCityInput(profile?.city, profile?.regionContext);
    } catch {
      return res.status(400).json({ error: 'Household profile with city is required.' });
    }

    try {
      const ai = getAiClient();
      const householdSize = Math.max(1, Math.min(12, Number(profile?.householdSize) || 4));
      const sensitive = Array.isArray(profile?.sensitiveMembers)
        ? profile.sensitiveMembers.map(String).slice(0, 6).join(', ')
        : 'general family';

      const prompt = `Create a tailored winter smog action playbook for this household:
- City: ${cleanCityInput.city} (${cleanCityInput.regionContext || 'urban winter conditions'})
- Local Air Brief: AQI ${Number(airBrief?.estimatedAqi) || 'N/A'}, PM2.5 ${Number(airBrief?.pm25UgM3) || 'N/A'} ug/m3 (${String(airBrief?.severityLevel ?? 'Elevated')}), Inversion window: ${String(airBrief?.inversionWindow ?? 'morning/evening').slice(0, 120)}, Best outdoor/ventilation window: ${String(airBrief?.bestVentilationWindow ?? 'early afternoon').slice(0, 120)}, Primary pollutants: ${String(airBrief?.primaryPollutants ?? 'PM2.5, NOx').slice(0, 160)}
- Household size: ${householdSize} people
- Sensitive members: ${sensitive || 'general family'}
- Heating type: ${String(profile?.heatingType || 'natural_gas').slice(0, 40)}
- Primary commute: ${String(profile?.commuteMode || 'car_solo').slice(0, 40)}
- Cooking fuel: ${String(profile?.cookingFuel || 'gas_stove').slice(0, 40)}
- Indoor air purifier setup: ${String(profile?.purifierSetup || 'none').slice(0, 40)}
- Home envelope: ${String(profile?.homeDraftiness || 'average').slice(0, 40)}

Generate exactly 6 high-impact, realistic recommendations (2 with category "daily_routine", 2 with category "indoor_hack", 2 with category "sustainable_swap") tailored specifically to their city, heating, commute, cooking fuel, and purifier setup.
Every recommendation MUST clearly explain the direct physical/health/emissions impact of the choice in plain, accurate science.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          systemInstruction:
            'You are VinterKlar, an environmental health and urban air-quality engineer advising families during severe winter smog. Be specific, practical, empathetic, and quantitative. Avoid generic platitudes.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headlineInsight: {
                type: Type.STRING,
                description: 'A crisp 1-2 sentence synthesis of the highest-leverage choice for this specific family.',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description: 'Must be one of: daily_routine, indoor_hack, sustainable_swap',
                    },
                    title: { type: Type.STRING },
                    timingOrCadence: { type: Type.STRING },
                    effortLevel: {
                      type: Type.STRING,
                      description: 'Must be one of: Zero Cost, Low Cost, Habit Shift, Upgrade',
                    },
                    summary: { type: Type.STRING },
                    howToSteps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    directImpactExplanation: {
                      type: Type.STRING,
                      description: 'Clear explanation of how and why this lowers exposure or emissions directly.',
                    },
                    estimatedPm25ExposureDropPct: { type: Type.NUMBER },
                    estimatedWeeklyPm25AvoidedGrams: { type: Type.NUMBER },
                    estimatedWeeklyCo2AvoidedKg: { type: Type.NUMBER },
                  },
                  required: [
                    'id',
                    'category',
                    'title',
                    'timingOrCadence',
                    'effortLevel',
                    'summary',
                    'howToSteps',
                    'directImpactExplanation',
                    'estimatedPm25ExposureDropPct',
                    'estimatedWeeklyPm25AvoidedGrams',
                    'estimatedWeeklyCo2AvoidedKg',
                  ],
                },
              },
            },
            required: ['headlineInsight', 'recommendations'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        headlineInsight?: string;
        recommendations?: unknown[];
      };

      return res.json({
        city: cleanCityInput.city,
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        headlineInsight:
          parsed.headlineInsight ||
          'Prioritize indoor filtration during peak inversion hours and shift short cold-start trips.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      });
    } catch (err) {
      const { status, message } = formatApiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 4. Contextual Streaming Clean-Air Advisor Chat (SSE)
  app.post('/api/advisor/chat', async (req, res) => {
    let cleanMessages;
    try {
      cleanMessages = sanitizeChatMessages(req.body?.messages);
    } catch (validationErr) {
      return res.status(400).json({
        error: validationErr instanceof Error ? validationErr.message : 'Invalid messages.',
      });
    }

    try {
      const { profile, airBrief, impactSummary } = req.body ?? {};
      const ai = getAiClient();
      const systemInstruction = `You are the VinterKlar Clean-Air Family & Community Advisor.
Current Context:
- Location: ${String(profile?.city || 'Urban winter city').slice(0, 120)} (AQI ${Number(airBrief?.estimatedAqi) || 'N/A'}, PM2.5 ${Number(airBrief?.pm25UgM3) || 'N/A'} µg/m³, Severity: ${String(airBrief?.severityLevel ?? 'Elevated').slice(0, 30)})
- Inversion Window: ${String(airBrief?.inversionWindow ?? 'Morning & Evening').slice(0, 120)} | Best Ventilation Window: ${String(airBrief?.bestVentilationWindow ?? 'Early afternoon').slice(0, 120)}
- Household: ${Math.max(1, Math.min(12, Number(profile?.householdSize) || 4))} people, sensitive members: ${Array.isArray(profile?.sensitiveMembers) ? profile.sensitiveMembers.map(String).slice(0, 6).join(', ') : 'none specified'}
- Home Setup: heating=${String(profile?.heatingType || 'natural_gas').slice(0, 40)}, commute=${String(profile?.commuteMode || 'car_solo').slice(0, 40)}, cooking=${String(profile?.cookingFuel || 'gas_stove').slice(0, 40)}, purifier=${String(profile?.purifierSetup || 'none').slice(0, 40)}, envelope=${String(profile?.homeDraftiness || 'average').slice(0, 40)}
- Active Impact Calculator Results: Indoor PM2.5 drops from ${Number(impactSummary?.baselineIndoorPm25) || '?'} to ${Number(impactSummary?.mitigatedIndoorPm25) || '?'} µg/m³ (-${Number(impactSummary?.indoorDropPct) || 0}%), Weekly PM2.5 avoided: ${Number(impactSummary?.weeklyPm25AvoidedGrams) || 0} g.

Guidelines:
- Give concise, practical, science-backed guidance tailored to this exact family and city.
- Always explain the direct impact of recommended actions (both personal exposure reduction and community emission reduction).
- Keep formatting clean with short paragraphs or concise bullet points.`;

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
      const { status, message } = formatApiError(err);
      if (!res.headersSent) {
        return res.status(status).json({ error: message });
      }
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VinterKlar server listening on http://localhost:${PORT}`);
  });
}

startServer();
