export interface ValidatedCityInput {
  city: string;
  regionContext: string;
}

export interface ValidatedChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return { status: 500, message: raw };
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
  return { status: 500, message: raw || 'Unexpected server error while querying Gemini.' };
}

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

export function sanitizeCityInput(city: unknown, regionContext: unknown): ValidatedCityInput {
  if (typeof city !== 'string' || !city.trim()) {
    throw new Error('A city or neighborhood name is required.');
  }
  const cleanCity = city.trim().slice(0, 120);
  const cleanRegion =
    typeof regionContext === 'string' ? regionContext.trim().slice(0, 240) : '';
  return { city: cleanCity, regionContext: cleanRegion };
}

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

export function sanitizeChatMessages(messages: unknown): ValidatedChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Conversation messages are required.');
  }
  return messages.slice(-30).map((m) => {
    const record = m as { role?: unknown; content?: unknown };
    const role = record?.role === 'assistant' ? 'assistant' : 'user';
    const content = typeof record?.content === 'string' ? record.content.trim().slice(0, 2000) : '';
    if (!content) {
      throw new Error('Message content cannot be empty.');
    }
    return { role, content };
  });
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
