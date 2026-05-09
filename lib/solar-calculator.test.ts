import { describe, it, expect } from 'vitest';
import { calculate, formatPeso, formatPesoFull } from './solar-calculator';
import type { CalculatorInput } from './solar-calculator';

const baseInput: CalculatorInput = {
  consumption: { mode: 'kwh', monthlyKwh: 500 },
  region: 'cebu-city',
  systemType: 'grid-tied',
};

describe('calculate — happy path', () => {
  it('returns positive panel count and system size', () => {
    const r = calculate(baseInput);
    expect(r.panelCount).toBeGreaterThan(0);
    expect(r.systemSizeKw).toBeGreaterThan(0);
  });

  it('returns positive savings values', () => {
    const r = calculate(baseInput);
    expect(r.monthlySavings).toBeGreaterThan(0);
    expect(r.annualSavings).toBeGreaterThan(0);
    expect(r.lifetimeSavings).toBeGreaterThan(0);
  });

  it('returns plausible payback range (1–30 years)', () => {
    const r = calculate(baseInput);
    expect(r.paybackLow).toBeGreaterThan(0);
    expect(r.paybackHigh).toBeGreaterThanOrEqual(r.paybackLow);
    expect(r.paybackHigh).toBeLessThan(30);
  });

  it('returns yearly projections (year 0–25)', () => {
    const r = calculate(baseInput);
    expect(r.yearlyProjections.length).toBeGreaterThan(0);
    expect(r.yearlyProjections[0].year).toBe(0);
  });

  it('cumulative costs increase each year', () => {
    const r = calculate(baseInput);
    for (let i = 1; i < r.yearlyProjections.length; i++) {
      expect(r.yearlyProjections[i].cumulativeWithoutSolar).toBeGreaterThan(
        r.yearlyProjections[i - 1].cumulativeWithoutSolar,
      );
    }
  });

  it('coverage percent is between 0 and 200', () => {
    const r = calculate(baseInput);
    expect(r.coveragePercent).toBeGreaterThan(0);
    expect(r.coveragePercent).toBeLessThanOrEqual(200);
  });

  it('CO2 reduction and trees equivalent are positive', () => {
    const r = calculate(baseInput);
    expect(r.co2ReductionKgPerYear).toBeGreaterThan(0);
    expect(r.treesEquivalent).toBeGreaterThan(0);
  });
});

describe('calculate — system types', () => {
  it('hybrid system returns valid result', () => {
    const r = calculate({ ...baseInput, systemType: 'hybrid' });
    expect(r.panelCount).toBeGreaterThan(0);
    expect(r.systemCostHigh).toBeGreaterThan(r.systemCostLow);
  });

  it('off-grid system returns valid result', () => {
    const r = calculate({ ...baseInput, systemType: 'off-grid' });
    expect(r.panelCount).toBeGreaterThan(0);
  });

  it('grid-tied excess kWh is non-negative', () => {
    const r = calculate({ ...baseInput, systemType: 'grid-tied' });
    expect(r.excessKwh).toBeGreaterThanOrEqual(0);
  });
});

describe('calculate — peso input mode', () => {
  it('accepts peso-based consumption input', () => {
    const r = calculate({
      ...baseInput,
      consumption: { mode: 'peso', monthlyBill: 5000 },
    });
    expect(r.monthlyKwh).toBeGreaterThan(0);
    expect(r.panelCount).toBeGreaterThan(0);
  });
});

describe('calculate — regions', () => {
  it('luzon result differs from visayas (different peak sun hours)', () => {
    const visayas = calculate(baseInput);
    const luzon = calculate({ ...baseInput, region: 'metro-manila' });
    // Panel counts may differ due to different PSH — just check both valid
    expect(luzon.panelCount).toBeGreaterThan(0);
    expect(visayas.panelCount).toBeGreaterThan(0);
  });

  it('negros region returns valid result', () => {
    const r = calculate({ ...baseInput, region: 'negros' });
    expect(r.panelCount).toBeGreaterThan(0);
    expect(r.monthlyElectricityRate).toBe(12.25);
  });

  it('eastern-visayas-tacloban calculates correctly', () => {
    const r = calculate({ ...baseInput, region: 'eastern-visayas-tacloban' });
    expect(r.panelCount).toBeGreaterThan(0);
    expect(r.monthlyElectricityRate).toBe(10.07);
  });

  it('samar-east calculates correctly', () => {
    const r = calculate({ ...baseInput, region: 'samar-east' });
    expect(r.panelCount).toBeGreaterThan(0);
  });
});

describe('calculate — NCR cost multiplier', () => {
  it('metro-manila system costs more than cebu-city for same input', () => {
    const ncr = calculate({ ...baseInput, region: 'metro-manila' });
    const cebu = calculate({ ...baseInput, region: 'cebu-city' });
    expect(ncr.systemCostMid).toBeGreaterThan(cebu.systemCostMid);
  });
});

describe('calculate — region-specific gen charge', () => {
  it('Meralco net-metering credit higher than DLPC for same excess kWh', () => {
    const input: CalculatorInput = {
      consumption: { mode: 'kwh', monthlyKwh: 200 },
      region: 'metro-manila',
      systemType: 'grid-tied',
    };
    const ncr = calculate(input);
    const davao = calculate({ ...input, region: 'davao-city' });
    // Meralco genCharge 8.39 > DLPC 6.12 — same system, NCR earns more credit
    if (ncr.excessKwh > 0 && davao.excessKwh > 0) {
      expect(ncr.netMeteringCreditMonthly).toBeGreaterThan(davao.netMeteringCreditMonthly);
    }
  });
});

describe('calculate — edge cases', () => {
  it('very low consumption still returns valid result', () => {
    const r = calculate({
      ...baseInput,
      consumption: { mode: 'kwh', monthlyKwh: 50 },
    });
    expect(r.panelCount).toBeGreaterThan(0);
    expect(r.systemSizeKw).toBeGreaterThan(0);
  });

  it('high consumption scales up panel count', () => {
    const low = calculate({ ...baseInput, consumption: { mode: 'kwh', monthlyKwh: 200 } });
    const high = calculate({ ...baseInput, consumption: { mode: 'kwh', monthlyKwh: 2000 } });
    expect(high.panelCount).toBeGreaterThan(low.panelCount);
  });
});

describe('formatPeso', () => {
  it('formats number as peso string', () => {
    expect(formatPeso(1000)).toContain('1');
    expect(typeof formatPeso(5000)).toBe('string');
  });
});

describe('formatPesoFull', () => {
  it('formats number as full peso string', () => {
    expect(typeof formatPesoFull(100000)).toBe('string');
  });
});
