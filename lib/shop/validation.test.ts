import { describe, it, expect } from 'vitest';
import { slugify, pesosToCentavos, parseNonNegInt, parseVariants } from './validation';

describe('pesosToCentavos', () => {
  it('converts a whole-peso string to centavos', () => {
    expect(pesosToCentavos('499')).toBe(49900);
  });

  it('converts a peso string with cents to centavos', () => {
    expect(pesosToCentavos('499.99')).toBe(49999);
  });

  it('rounds to the nearest centavo', () => {
    // 10.005 * 100 = 1000.4999... → rounds to 1001 in JS float terms.
    expect(pesosToCentavos('10.005')).toBe(1001);
  });

  it('handles zero', () => {
    expect(pesosToCentavos('0')).toBe(0);
  });

  it('returns null for null', () => {
    expect(pesosToCentavos(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(pesosToCentavos('')).toBeNull();
  });

  it('returns null for a non-numeric string', () => {
    expect(pesosToCentavos('abc')).toBeNull();
  });

  it('returns null for a negative amount', () => {
    expect(pesosToCentavos('-5')).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(pesosToCentavos('Infinity')).toBeNull();
  });
});

describe('slugify', () => {
  it('lowercases and dash-joins words', () => {
    expect(slugify('Solar Flood Light 100W')).toBe('solar-flood-light-100w');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('  --Hello--  ')).toBe('hello');
  });

  it('collapses runs of non-alphanumeric characters into a single dash', () => {
    expect(slugify('A & B / C')).toBe('a-b-c');
  });

  it('returns an empty string when there are no alphanumerics', () => {
    expect(slugify('!!!')).toBe('');
  });

  it('preserves alphanumeric-only input', () => {
    expect(slugify('abc123')).toBe('abc123');
  });
});

describe('parseNonNegInt', () => {
  it('parses a valid integer', () => {
    expect(parseNonNegInt('10')).toEqual({ value: 10, valid: true });
  });

  it('parses zero', () => {
    expect(parseNonNegInt('0')).toEqual({ value: 0, valid: true });
  });

  it('treats null as missing (valid, null value)', () => {
    expect(parseNonNegInt(null)).toEqual({ value: null, valid: true });
  });

  it('treats empty string as missing (valid, null value)', () => {
    expect(parseNonNegInt('')).toEqual({ value: null, valid: true });
  });

  it('rejects a negative integer', () => {
    expect(parseNonNegInt('-1')).toEqual({ value: null, valid: false });
  });

  it('rejects a float', () => {
    expect(parseNonNegInt('1.5')).toEqual({ value: null, valid: false });
  });

  it('rejects a non-numeric string', () => {
    expect(parseNonNegInt('abc')).toEqual({ value: null, valid: false });
  });
});

describe('parseVariants', () => {
  it('returns null variants for absent/empty/[] payloads', () => {
    expect(parseVariants(null)).toEqual({ variants: null });
    expect(parseVariants('')).toEqual({ variants: null });
    expect(parseVariants('   ')).toEqual({ variants: null });
    expect(parseVariants('[]')).toEqual({ variants: null });
  });

  it('parses a valid variant array into typed centavos variants', () => {
    const raw = JSON.stringify([
      { id: 'v1', label: 'Small', sku: 'SKU-S', price: '100', stock: '5' },
      { id: 'v2', label: 'Large', sku: 'SKU-L', price: '199.99', stock: '0' },
    ]);
    const { variants, error } = parseVariants(raw);
    expect(error).toBeUndefined();
    expect(variants).toEqual([
      { id: 'v1', label: 'Small', sku: 'SKU-S', price_centavos: 10000, stock: 5 },
      { id: 'v2', label: 'Large', sku: 'SKU-L', price_centavos: 19999, stock: 0 },
    ]);
  });

  it('assigns a generated id when a row has no id', () => {
    const raw = JSON.stringify([{ label: 'X', sku: 'SKU-X', price: '10', stock: '1' }]);
    const { variants } = parseVariants(raw);
    expect(variants).toHaveLength(1);
    expect(variants![0].id).toBeTruthy();
    expect(typeof variants![0].id).toBe('string');
  });

  it('assigns a generated id when the supplied id is blank', () => {
    const raw = JSON.stringify([{ id: '  ', label: 'X', sku: 'SKU-X', price: '10', stock: '1' }]);
    const { variants } = parseVariants(raw);
    expect(variants![0].id.trim()).not.toBe('');
  });

  it('errors when a variant is missing a label', () => {
    const raw = JSON.stringify([{ sku: 'SKU-X', price: '10', stock: '1' }]);
    expect(parseVariants(raw)).toEqual({ variants: null, error: 'Each variant needs a label.' });
  });

  it('errors when a variant is missing a sku', () => {
    const raw = JSON.stringify([{ label: 'X', price: '10', stock: '1' }]);
    expect(parseVariants(raw)).toEqual({ variants: null, error: 'Variant "X" needs a SKU.' });
  });

  it('errors when a variant has an invalid price', () => {
    const raw = JSON.stringify([{ label: 'X', sku: 'SKU-X', price: '-5', stock: '1' }]);
    expect(parseVariants(raw)).toEqual({ variants: null, error: 'Variant "X" needs a valid price.' });
  });

  it('errors when a variant has an invalid stock count', () => {
    const raw = JSON.stringify([{ label: 'X', sku: 'SKU-X', price: '10', stock: '1.5' }]);
    expect(parseVariants(raw)).toEqual({
      variants: null,
      error: 'Variant "X" needs a valid stock count.',
    });
  });

  it('errors on malformed JSON', () => {
    expect(parseVariants('{not json')).toEqual({
      variants: null,
      error: 'Variants payload is malformed.',
    });
  });

  it('errors when the payload is a JSON object instead of an array', () => {
    expect(parseVariants('{"label":"X"}')).toEqual({
      variants: null,
      error: 'Variants payload is malformed.',
    });
  });
});
