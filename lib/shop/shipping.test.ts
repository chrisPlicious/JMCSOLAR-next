import { describe, it, expect } from 'vitest';
import {
  getShippingFee,
  regionShippingFees,
  DEFAULT_SHIPPING_FEE_CENTAVOS,
} from './shipping';

describe('getShippingFee — delivery', () => {
  it('returns the Ormoc City proper fee (30000 centavos)', () => {
    expect(getShippingFee('ormoc_city', 'delivery')).toBe(30000);
  });

  it('returns the Luzon fee (200000 centavos)', () => {
    expect(getShippingFee('luzon', 'delivery')).toBe(200000);
  });

  it('returns the Mindanao fee (200000 centavos)', () => {
    expect(getShippingFee('mindanao', 'delivery')).toBe(200000);
  });

  it.each(Object.entries(regionShippingFees))(
    'returns the mapped fee for region "%s"',
    (region, fee) => {
      expect(getShippingFee(region, 'delivery')).toBe(fee);
    },
  );
});

describe('getShippingFee — pickup', () => {
  it.each(Object.keys(regionShippingFees))(
    'returns 0 for pickup regardless of region ("%s")',
    (region) => {
      expect(getShippingFee(region, 'pickup')).toBe(0);
    },
  );

  it('returns 0 for pickup even for an unknown region', () => {
    expect(getShippingFee('atlantis', 'pickup')).toBe(0);
  });
});

describe('getShippingFee — unknown region', () => {
  it('falls back to DEFAULT_SHIPPING_FEE_CENTAVOS (250000) for an unmapped region on delivery', () => {
    expect(getShippingFee('atlantis', 'delivery')).toBe(DEFAULT_SHIPPING_FEE_CENTAVOS);
    expect(getShippingFee('atlantis', 'delivery')).toBe(250000);
  });

  it('falls back to the default for an empty region string on delivery', () => {
    expect(getShippingFee('', 'delivery')).toBe(DEFAULT_SHIPPING_FEE_CENTAVOS);
  });
});
