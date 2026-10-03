import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('normalizes a Russian international number', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567');
  });

  it('accepts a Belarusian international number', () => {
    expect(normalizePhone('+375 (29) 123-45-67')).toBe('375291234567');
  });

  it('rejects unsupported lengths and country codes', () => {
    expect(normalizePhone('+7 999 123 456')).toBeNull();
    expect(normalizePhone('+375 29 123 456')).toBeNull();
    expect(normalizePhone('+1 202 555 0100')).toBeNull();
  });
});
