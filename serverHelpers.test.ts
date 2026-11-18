import { describe, it, expect } from 'vitest';
import {
  extractJsonBlock,
  formatApiError,
  isSafeHttpUrl,
  sanitizeChatMessages,
  sanitizeCityInput,
  validateCoordinates,
} from './serverHelpers';

describe('serverHelpers security & validation', () => {
  it('sanitizes valid city inputs and rejects empty or non-string values', () => {
    expect(sanitizeCityInput('  Salt Lake City, UT  ', 'Wasatch valley')).toEqual({
      city: 'Salt Lake City, UT',
      regionContext: 'Wasatch valley',
    });
    expect(() => sanitizeCityInput('', '')).toThrow('A city or neighborhood name is required.');
    expect(() => sanitizeCityInput(null, '')).toThrow();
  });

  it('truncates excessively long city and region strings', () => {
    const longCity = 'A'.repeat(300);
    const result = sanitizeCityInput(longCity, 'B'.repeat(400));
    expect(result.city.length).toBe(120);
    expect(result.regionContext.length).toBe(240);
  });

  it('validates geographic coordinate bounds', () => {
    expect(validateCoordinates(40.76, -111.89)).toEqual({ latitude: 40.76, longitude: -111.89 });
    expect(() => validateCoordinates(95, 0)).toThrow();
    expect(() => validateCoordinates(0, -190)).toThrow();
    expect(() => validateCoordinates('40', '-111')).toThrow();
  });

  it('sanitizes chat messages and caps history length', () => {
    const messages = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    const cleaned = sanitizeChatMessages(messages);
    expect(cleaned.length).toBe(30);
    expect(cleaned[0].content).toBe('Message 10');
    expect(() => sanitizeChatMessages([])).toThrow();
  });

  it('extracts JSON safely from markdown fences or raw prose', () => {
    const fenced = 'Here is the brief:\n```json\n{"city":"Oslo","estimatedAqi":92}\n```';
    expect(extractJsonBlock(fenced)).toEqual({ city: 'Oslo', estimatedAqi: 92 });

    const bare = 'Result: {"city":"Kraków","estimatedAqi":154} end';
    expect(extractJsonBlock(bare)).toEqual({ city: 'Kraków', estimatedAqi: 154 });
  });

  it('maps Gemini upstream errors to clear HTTP status codes', () => {
    expect(formatApiError(new Error('GEMINI_API_KEY is not configured.')).status).toBe(500);
    expect(formatApiError(new Error('403 PERMISSION_DENIED')).status).toBe(403);
    expect(formatApiError(new Error('429 RESOURCE_EXHAUSTED')).status).toBe(429);
    expect(formatApiError(new Error('404 NOT_FOUND')).status).toBe(404);
  });

  it('allows only http and https URLs for citation links', () => {
    expect(isSafeHttpUrl('https://airnow.gov/report')).toBe(true);
    expect(isSafeHttpUrl('http://example.org/data')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeHttpUrl('not-a-url')).toBe(false);
  });
});
