import { isSafeHttpUrl } from './src/utils/url.ts';

export { isSafeHttpUrl };

export interface ValidatedCityInput {
  city: string;
  regionContext: string;
}

export interface ValidatedChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SanitizedHouseholdContext {
  city: string;
  regionContext: string;
  householdSize: number;
  sensitiveMembers: string[];
  heatingType: string;
  commuteMode: string;
  cookingFuel: string;
  purifierSetup: string;
  homeDraftiness: string;
}

export interface SanitizedAirBriefContext {
  estimatedAqi: number | null;
  pm25UgM3: number | null;
  severityLevel: string;
  inversionWindow: string;
  bestVentilationWindow: string;
  primaryPollutants: string;
}

const VALID_HEATING_TYPES = new Set([
  'natural_gas',
  'wood_stove',
  'electric_heat_pump',
  'district_heating',
]);

const VALID_COMMUTE_MODES = new Set([
  'car_solo',
  'carpool',
  'public_transit',
  'walk_bike',
  'remote',
]);

const VALID_COOKING_FUELS = new Set(['gas_stove', 'electric_induction']);

const VALID_PURIFIER_SETUPS = new Set([
  'none',
  'hepa_portable',
  'diy_corsi_rosenthal',
  'central_merv13',
]);

const VALID_DRAFTINESS = new Set(['tight', 'average', 'drafty']);

const VALID_SENSITIVE_MEMBERS = new Set([
  'young_children',
  'asthma_respiratory',
  'older_adults',
  'pregnant',
]);

const VALID_SEVERITY_LEVELS = new Set(['Nominal', 'Moderate', 'Unhealthy', 'Severe']);

/**
 * Strips ASCII control characters and collapses line breaks into single spaces
 * to prevent newline/prompt-structure injection in single-line fields.
 */
export function sanitizeSingleLine(value: unknown, maxLength: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return cleaned || fallback;
}

function allowlist(value: unknown, allowed: ReadonlySet<string>, fallback: string): string {
  return typeof value === 'string' && allowed.has(value) ? value : fallback;
}

/**
 * Maps internal or upstream Gemini errors to safe, client-facing HTTP status codes
 * and messages without leaking internal stack traces or opaque backend details.
 */
export function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return {
      status: 500,
      message: 'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'API key permission or validation error. Please verify your key in Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Gemini API rate limit reached. Please wait a moment and try again.',
    };
  }
  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'Requested Gemini model could not be found.',
    };
  }
  return {
    status: 500,
    message: 'Unable to complete the air-quality request right now. Please try again shortly.',
  };
}

/**
 * Extracts and parses a JSON object from either fenced markdown blocks or raw text.
 */
export function extractJsonBlock(text: string): unknown {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text.trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  }
  return JSON.parse(candidate);
}

/**
 * Validates and sanitizes city and optional regional topography context.
 */
export function sanitizeCityInput(city: unknown, regionContext: unknown): ValidatedCityInput {
  const cleanCity = sanitizeSingleLine(city, 120);
  if (!cleanCity) {
    throw new Error('A city or neighborhood name is required.');
  }
  const cleanRegion = sanitizeSingleLine(regionContext, 240);
  return { city: cleanCity, regionContext: cleanRegion };
}

/**
 * Validates latitude (-90..90) and longitude (-180..180) coordinates.
 */
export function validateCoordinates(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Valid latitude (-90 to 90) and longitude (-180 to 180) are required.');
  }
  return { latitude, longitude };
}

/**
 * Sanitizes and allowlist-validates a household profile payload before prompt construction.
 */
export function sanitizeHouseholdProfile(
  profile: unknown,
  requireCity = true,
): SanitizedHouseholdContext {
  const record = (profile && typeof profile === 'object' ? profile : {}) as Record<string, unknown>;
  const cityInput = requireCity
    ? sanitizeCityInput(record.city, record.regionContext)
    : {
        city: sanitizeSingleLine(record.city, 120, 'Urban winter city'),
        regionContext: sanitizeSingleLine(record.regionContext, 240, 'urban winter conditions'),
      };

  const rawSize = Number(record.householdSize);
  const householdSize = Number.isFinite(rawSize)
    ? Math.max(1, Math.min(12, Math.round(rawSize)))
    : 4;

  const sensitiveMembers = Array.isArray(record.sensitiveMembers)
    ? record.sensitiveMembers
        .filter((item): item is string => typeof item === 'string' && VALID_SENSITIVE_MEMBERS.has(item))
        .slice(0, 6)
    : [];

  return {
    city: cityInput.city,
    regionContext: cityInput.regionContext || 'urban winter conditions',
    householdSize,
    sensitiveMembers,
    heatingType: allowlist(record.heatingType, VALID_HEATING_TYPES, 'natural_gas'),
    commuteMode: allowlist(record.commuteMode, VALID_COMMUTE_MODES, 'car_solo'),
    cookingFuel: allowlist(record.cookingFuel, VALID_COOKING_FUELS, 'gas_stove'),
    purifierSetup: allowlist(record.purifierSetup, VALID_PURIFIER_SETUPS, 'none'),
    homeDraftiness: allowlist(record.homeDraftiness, VALID_DRAFTINESS, 'average'),
  };
}

/**
 * Sanitizes air-brief context metadata passed into playbook and advisor requests.
 */
export function sanitizeAirBriefContext(airBrief: unknown): SanitizedAirBriefContext {
  const record = (airBrief && typeof airBrief === 'object' ? airBrief : {}) as Record<
    string,
    unknown
  >;
  const rawAqi = Number(record.estimatedAqi);
  const rawPm25 = Number(record.pm25UgM3);

  return {
    estimatedAqi: Number.isFinite(rawAqi) ? Math.max(0, Math.min(500, Math.round(rawAqi))) : null,
    pm25UgM3: Number.isFinite(rawPm25) ? Math.max(0, Math.min(1000, Number(rawPm25.toFixed(1)))) : null,
    severityLevel: allowlist(record.severityLevel, VALID_SEVERITY_LEVELS, 'Moderate'),
    inversionWindow: sanitizeSingleLine(record.inversionWindow, 120, 'morning & evening'),
    bestVentilationWindow: sanitizeSingleLine(record.bestVentilationWindow, 120, 'early afternoon'),
    primaryPollutants: sanitizeSingleLine(record.primaryPollutants, 160, 'PM2.5, NOx'),
  };
}

/**
 * Validates and caps chat message history before forwarding to Gemini.
 */
export function sanitizeChatMessages(messages: unknown): ValidatedChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Conversation messages are required.');
  }
  return messages.slice(-30).map((m) => {
    const record = (m && typeof m === 'object' ? m : {}) as { role?: unknown; content?: unknown };
    const role = record.role === 'assistant' ? 'assistant' : 'user';
    const content =
      typeof record.content === 'string'
        ? record.content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 2000)
        : '';
    if (!content) {
      throw new Error('Message content cannot be empty.');
    }
    return { role, content };
  });
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Creates a lightweight in-memory sliding-window rate limiter keyed by client identifier.
 */
export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;
  const buckets = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): RateLimitCheckResult {
      const cutoff = now - windowMs;
      const existing = buckets.get(key) ?? [];
      const active = existing.filter((ts) => ts > cutoff);

      if (active.length >= maxRequests) {
        const oldest = active[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        buckets.set(key, active);
        return { allowed: false, remaining: 0, retryAfterSeconds };
      }

      active.push(now);
      buckets.set(key, active);

      // Prune stale keys periodically to bound memory usage
      if (buckets.size > 500) {
        for (const [bucketKey, timestamps] of buckets.entries()) {
          if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= cutoff) {
            buckets.delete(bucketKey);
          }
        }
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - active.length),
        retryAfterSeconds: 0,
      };
    },
    reset() {
      buckets.clear();
    },
  };
}
