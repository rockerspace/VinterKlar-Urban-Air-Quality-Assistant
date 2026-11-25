/**
 * Validates that a URL uses an explicit `http:` or `https:` protocol,
 * preventing unsafe schemes such as `javascript:` or `data:` in rendered links.
 */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
