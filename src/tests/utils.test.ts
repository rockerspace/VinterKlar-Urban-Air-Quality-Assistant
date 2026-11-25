import { describe, it, expect } from 'vitest';
import { isSafeHttpUrl } from '../utils/url';
import { calculateRoomCadr, CADR_CONSTANTS } from '../utils/cadr';

describe('url safety utilities', () => {
  it('accepts valid http and https URLs', () => {
    expect(isSafeHttpUrl('https://airnow.gov/report?city=slc')).toBe(true);
    expect(isSafeHttpUrl('http://localhost:3000/status')).toBe(true);
  });

  it('rejects dangerous protocols and malformed strings', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeHttpUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl('not-a-valid-url')).toBe(false);
  });
});

describe('calculateRoomCadr sizing utility', () => {
  it('computes accurate CADR CFM, airflow m3/h, and cube count for a standard living room', () => {
    const result = calculateRoomCadr(35, 2.6);
    expect(result.roomVolumeM3).toBe(91);
    expect(result.areaSqFt).toBe(Math.round(35 * CADR_CONSTANTS.SQFT_PER_M2));
    expect(result.requiredCadrM3h).toBe(Math.round(91 * CADR_CONSTANTS.TARGET_ACH));
    expect(result.requiredCadrCfm).toBe(Math.round(result.requiredCadrM3h / CADR_CONSTANTS.M3H_PER_CFM));
    expect(result.cubesNeeded).toBe(1);
  });

  it('scales recommended Corsi-Rosenthal cubes for large open-plan rooms', () => {
    const largeRoom = calculateRoomCadr(80, 3.2);
    expect(largeRoom.requiredCadrCfm).toBeGreaterThan(CADR_CONSTANTS.CORSI_ROSENTHAL_CFM);
    expect(largeRoom.cubesNeeded).toBeGreaterThanOrEqual(2);
  });

  it('guards against invalid or non-positive room dimensions safely', () => {
    const fallback = calculateRoomCadr(Number.NaN, -5);
    expect(fallback.roomVolumeM3).toBeGreaterThan(0);
    expect(fallback.requiredCadrCfm).toBeGreaterThan(0);
    expect(fallback.cubesNeeded).toBe(1);
  });
});
