// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { createApp, type AiClientLike } from './serverApp.ts';

function createMockAiClient(): AiClientLike {
  return {
    models: {
      async generateContent(params) {
        const contents = String(params.contents ?? '');
        if (contents.includes('Identify the city')) {
          return {
            text: JSON.stringify({
              city: 'Oslo, Norway',
              regionContext: 'Fjord valley thermal inversion',
            }),
          };
        }
        if (contents.includes('Create a tailored winter smog action playbook')) {
          return {
            text: JSON.stringify({
              headlineInsight: 'Run MERV-13 filtration overnight and consolidate errands.',
              recommendations: [
                {
                  id: 'rec-1',
                  category: 'indoor_hack',
                  title: 'Seal bedroom doors overnight',
                  timingOrCadence: 'Nightly',
                  effortLevel: 'Zero Cost',
                  summary: 'Concentrate clean air in sleeping areas.',
                  howToSteps: ['Close bedroom doors at 21:00'],
                  directImpactExplanation: 'Cuts bedroom PM2.5 infiltration quickly.',
                  estimatedPm25ExposureDropPct: 45,
                  estimatedWeeklyPm25AvoidedGrams: 0,
                  estimatedWeeklyCo2AvoidedKg: 0,
                },
              ],
            }),
          };
        }
        return {
          text: '```json\n{"city":"Salt Lake City, UT","estimatedAqi":132,"pm25UgM3":48.2,"severityLevel":"Unhealthy","inversionWindow":"06:00 - 11:00","bestVentilationWindow":"13:00 - 15:00","primaryPollutants":"PM2.5, NOx","advisorySummary":"Valley inversion active today.","localTriggers":["Morning commute"]}\n```',
          candidates: [
            {
              groundingMetadata: {
                groundingChunks: [
                  { web: { title: 'AirNow Utah', uri: 'https://airnow.gov/utah' } },
                  { web: { title: 'Unsafe Script', uri: 'javascript:alert(1)' } },
                ],
              },
            },
          ],
        };
      },
      async generateContentStream() {
        async function* gen() {
          yield { text: 'Keep windows closed ' };
          yield { text: 'until 13:00.' };
        }
        return gen();
      },
    },
  };
}

describe('serverApp Express API integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp({
      aiClientFactory: () => createMockAiClient(),
      rateLimitMaxRequests: 100,
      rateLimitWindowMs: 60_000,
    });
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('sets hardened security headers and omits X-Powered-By', async () => {
    const res = await fetch(`${baseUrl}/api/air-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Salt Lake City, UT' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-powered-by')).toBeNull();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('permissions-policy')).toContain('geolocation=(self)');
    expect(res.headers.get('x-dns-prefetch-control')).toBe('off');
    expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups');
  });

  it('POST /api/air-brief returns grounded air brief and filters unsafe citation URLs', async () => {
    const res = await fetch(`${baseUrl}/api/air-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Salt Lake City, UT', regionContext: 'Wasatch Front' }),
    });
    const data = (await res.json()) as {
      city: string;
      estimatedAqi: number;
      citations: { url: string }[];
      isLiveGrounded: boolean;
    };

    expect(res.status).toBe(200);
    expect(data.city).toBe('Salt Lake City, UT');
    expect(data.estimatedAqi).toBe(132);
    expect(data.isLiveGrounded).toBe(true);
    expect(data.citations).toHaveLength(1);
    expect(data.citations[0].url).toBe('https://airnow.gov/utah');
  });

  it('POST /api/air-brief returns 400 on missing city', async () => {
    const res = await fetch(`${baseUrl}/api/air-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: '   ' }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('city');
  });

  it('POST /api/resolve-city resolves coordinates and rejects out-of-range inputs', async () => {
    const okRes = await fetch(`${baseUrl}/api/resolve-city`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 59.91, longitude: 10.75 }),
    });
    expect(okRes.status).toBe(200);
    const okData = (await okRes.json()) as { city: string };
    expect(okData.city).toBe('Oslo, Norway');

    const badRes = await fetch(`${baseUrl}/api/resolve-city`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 120, longitude: 10 }),
    });
    expect(badRes.status).toBe(400);
  });

  it('POST /api/playbook generates structured recommendations and validates profile city', async () => {
    const okRes = await fetch(`${baseUrl}/api/playbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: { city: 'Oslo, Norway', householdSize: 3 },
        airBrief: { estimatedAqi: 92, pm25UgM3: 31 },
      }),
    });
    expect(okRes.status).toBe(200);
    const data = (await okRes.json()) as { city: string; recommendations: unknown[] };
    expect(data.city).toBe('Oslo, Norway');
    expect(data.recommendations).toHaveLength(1);

    const badRes = await fetch(`${baseUrl}/api/playbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: {} }),
    });
    expect(badRes.status).toBe(400);
  });

  it('POST /api/advisor/chat streams SSE chunks and validates message array', async () => {
    const okRes = await fetch(`${baseUrl}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'When should I air out the home?' }],
        profile: { city: 'Oslo, Norway' },
      }),
    });
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('content-type')).toContain('text/event-stream');
    const bodyText = await okRes.text();
    expect(bodyText).toContain('Keep windows closed ');
    expect(bodyText).toContain('until 13:00.');
    expect(bodyText).toContain('data: [DONE]');

    const badRes = await fetch(`${baseUrl}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(badRes.status).toBe(400);
  });

  it('returns clean JSON 400 error on malformed JSON body', async () => {
    const res = await fetch(`${baseUrl}/api/air-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"city": broken-json',
    });
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('Malformed JSON request body.');
  });

  it('enforces API rate limiting with HTTP 429 and Retry-After header', async () => {
    const limitedApp = createApp({
      aiClientFactory: () => createMockAiClient(),
      rateLimitMaxRequests: 1,
      rateLimitWindowMs: 60_000,
    });
    const limitedServer = await new Promise<Server>((resolve) => {
      const s = limitedApp.listen(0, '127.0.0.1', () => resolve(s));
    });
    const addr = limitedServer.address() as AddressInfo;
    const limitedUrl = `http://127.0.0.1:${addr.port}`;

    try {
      const first = await fetch(`${limitedUrl}/api/air-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: 'Oslo' }),
      });
      expect(first.status).toBe(200);

      const second = await fetch(`${limitedUrl}/api/air-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: 'Oslo' }),
      });
      expect(second.status).toBe(429);
      expect(Number(second.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    } finally {
      await new Promise<void>((resolve) => limitedServer.close(() => resolve()));
    }
  });
});
