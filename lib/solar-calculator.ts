/**
 * JMC Solar Calculator — Calculation Engine
 * Pure functions, fully typed. No side effects.
 */

// ---------------------------------------------------------------------------
// Region data
// ---------------------------------------------------------------------------

export const REGIONS = {
  'metro-manila': { label: 'Metro Manila / NCR', rate: 14.08, psh: 4.75 },
  'bulacan-rizal-cavite': { label: 'Bulacan / Rizal / Cavite', rate: 14.08, psh: 4.75 },
  'cebu-city': { label: 'Cebu City', rate: 12.79, psh: 5.0 },
  'cebu-province': { label: 'Cebu Province', rate: 13.37, psh: 4.9 },
  'davao-city': { label: 'Davao City', rate: 10.47, psh: 5.2 },
  'mindanao-general': { label: 'General Santos / Mindanao', rate: 10.0, psh: 5.2 },
  'cdo': { label: 'Cagayan de Oro', rate: 10.0, psh: 5.0 },
  'baguio': { label: 'Baguio / Benguet', rate: 11.0, psh: 4.2 },
  'iloilo': { label: 'Iloilo', rate: 11.5, psh: 5.0 },
  'palawan': { label: 'Palawan', rate: 12.5, psh: 4.75 },
  'other': { label: 'Other / Not listed', rate: 12.0, psh: 4.5 },
} as const satisfies Record<string, { label: string; rate: number; psh: number }>;

export type RegionKey = keyof typeof REGIONS;

// ---------------------------------------------------------------------------
// System type
// ---------------------------------------------------------------------------

export type SystemType = 'grid-tied' | 'hybrid' | 'off-grid';

export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  'grid-tied': 'Grid-Tied (On-Grid)',
  'hybrid': 'Hybrid (Grid + Battery)',
  'off-grid': 'Off-Grid',
};

export const SYSTEM_TYPE_DESCRIPTIONS: Record<SystemType, string> = {
  'grid-tied': 'No battery. Best ROI. No backup during brownouts.',
  'hybrid': 'Battery + grid. Brownout protection. Longer payback.',
  'off-grid': 'Fully independent. Highest cost. Best for remote areas.',
};

// ---------------------------------------------------------------------------
// Cost lookup table — ₱ installed cost by system size bracket
// Format: [maxKw, lowCost, highCost]
// ---------------------------------------------------------------------------

type CostBracket = readonly [maxKw: number, low: number, high: number];

const GRID_TIED_COSTS: readonly CostBracket[] = [
  [1.5,     55_000,    80_000],
  [2.5,    110_000,   160_000],
  [4.0,    150_000,   250_000],
  [6.5,    275_000,   400_000],
  [9.0,    440_000,   640_000],
  [Infinity, 550_000, 800_000],
] as const;

const HYBRID_COSTS: readonly CostBracket[] = [
  [1.5,     155_000,  230_000],
  [2.5,     210_000,  310_000],
  [4.0,     250_000,  400_000],
  [6.5,     400_000,  650_000],
  [9.0,     540_000,  790_000],
  [Infinity, 650_000, 950_000],
] as const;

const OFF_GRID_COSTS: readonly CostBracket[] = [
  [1.5,     150_000,  250_000],
  [2.5,     300_000,  500_000],
  [4.0,     450_000,  750_000],
  [6.5,     750_000, 1_250_000],
  [9.0,   1_125_000, 1_875_000],
  [Infinity, 1_500_000, 2_500_000],
] as const;

const SYSTEM_COST_TABLE: Record<SystemType, readonly CostBracket[]> = {
  'grid-tied': GRID_TIED_COSTS,
  'hybrid':    HYBRID_COSTS,
  'off-grid':  OFF_GRID_COSTS,
};

// ---------------------------------------------------------------------------
// Calculator input — discriminated union on input mode
// ---------------------------------------------------------------------------

export type InputMode = 'kwh' | 'peso';

export interface KwhInput {
  readonly mode: 'kwh';
  readonly monthlyKwh: number;
}

export interface PesoInput {
  readonly mode: 'peso';
  readonly monthlyBill: number;
}

export type ConsumptionInput = KwhInput | PesoInput;

export interface CalculatorInput {
  readonly consumption: ConsumptionInput;
  readonly region: RegionKey;
  readonly systemType: SystemType;
  /** kWp per panel, default 0.45 */
  readonly panelWattage?: number;
  /** 0.75–0.80, default 0.78 */
  readonly efficiencyFactor?: number;
}

// ---------------------------------------------------------------------------
// Calculator result
// ---------------------------------------------------------------------------

export interface YearlyProjection {
  readonly year: number;
  readonly cumulativeWithoutSolar: number;
  readonly cumulativeWithSolar: number;
}

export interface CalculatorResult {
  readonly monthlyKwh: number;
  readonly systemSizeKw: number;
  readonly panelCount: number;
  readonly monthlyGenerationKwh: number;
  readonly coveragePercent: number;

  readonly monthlyElectricityRate: number; // ₱/kWh used

  readonly monthlySavings: number;
  readonly annualSavings: number;

  readonly systemCostLow: number;
  readonly systemCostHigh: number;
  readonly systemCostMid: number;

  readonly paybackLow: number;  // years
  readonly paybackHigh: number; // years

  readonly lifetimeSavings: number; // net of system cost (mid)
  readonly co2ReductionKgPerYear: number;
  readonly treesEquivalent: number;

  /** Net metering credit info — only meaningful for grid-tied */
  readonly excessKwh: number;
  readonly netMeteringCreditMonthly: number;

  /** 25-year projection for chart */
  readonly yearlyProjections: readonly YearlyProjection[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RATE_INCREASE_PA = 0.04;   // 4% annual electricity rate escalation
const PANEL_DEGRADATION_PA = 0.005; // 0.5% annual panel output decline
const CO2_FACTOR_KG_PER_KWH = 0.7;
const TREE_CO2_KG_PER_YEAR = 21;
const GENERATION_CHARGE_RATE = 6.5; // ₱/kWh for net metering credits

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

function lookupSystemCost(systemType: SystemType, systemSizeKw: number): [low: number, high: number] {
  const brackets = SYSTEM_COST_TABLE[systemType];
  for (const [maxKw, low, high] of brackets) {
    if (systemSizeKw <= maxKw) return [low, high];
  }
  const last = brackets[brackets.length - 1]!;
  return [last[1], last[2]];
}

function computeLifetimeSavings(
  baseAnnualSavings: number,
  systemCostMid: number,
  years = 25,
): { net: number; projections: YearlyProjection[] } {
  let cumWithSolar = systemCostMid; // starts at system cost
  let cumWithoutSolar = 0;
  const projections: YearlyProjection[] = [
    { year: 0, cumulativeWithoutSolar: 0, cumulativeWithSolar: systemCostMid },
  ];

  for (let n = 1; n <= years; n++) {
    const rateMultiplier = Math.pow(1 + RATE_INCREASE_PA, n);
    const degradeMultiplier = Math.pow(1 - PANEL_DEGRADATION_PA, n);
    const yearSavings = baseAnnualSavings * rateMultiplier * degradeMultiplier;
    const yearBill = baseAnnualSavings * rateMultiplier; // same escalation for without-solar

    cumWithoutSolar += yearBill;
    cumWithSolar -= yearSavings; // each year savings reduce the net cost
    if (cumWithSolar < 0) cumWithSolar = 0; // paid off

    projections.push({
      year: n,
      cumulativeWithoutSolar: Math.round(cumWithoutSolar),
      cumulativeWithSolar: Math.round(Math.max(cumWithSolar, 0)),
    });
  }

  // Net lifetime savings = total savings accumulated - system cost
  let totalSavings = 0;
  for (let n = 1; n <= years; n++) {
    const rateMultiplier = Math.pow(1 + RATE_INCREASE_PA, n);
    const degradeMultiplier = Math.pow(1 - PANEL_DEGRADATION_PA, n);
    totalSavings += baseAnnualSavings * rateMultiplier * degradeMultiplier;
  }

  return {
    net: Math.round(totalSavings - systemCostMid),
    projections,
  };
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export function calculate(input: CalculatorInput): CalculatorResult {
  const region = REGIONS[input.region];
  const panelWattageKw = (input.panelWattage ?? 450) / 1000;
  const efficiency = input.efficiencyFactor ?? 0.78;
  const rate = region.rate;
  const psh = region.psh;

  // 1. Monthly kWh
  const monthlyKwh =
    input.consumption.mode === 'kwh'
      ? input.consumption.monthlyKwh
      : input.consumption.monthlyBill / rate;

  // 2. System size
  const dailyKwh = monthlyKwh / 30;
  const systemSizeKw = dailyKwh / psh / efficiency;

  // 3. Panel count (round up)
  const panelCount = Math.ceil(systemSizeKw / panelWattageKw);

  // 4. Actual system size after rounding panels up
  const actualSystemSizeKw = panelCount * panelWattageKw;

  // 5. Monthly generation
  const monthlyGenerationKwh = actualSystemSizeKw * psh * 30 * efficiency;

  // 6. Coverage %
  const coveragePercent = Math.min(100, Math.round((monthlyGenerationKwh / monthlyKwh) * 100));

  // 7. Monthly savings (capped at consumption — can't save more than you spend)
  const usableGeneration = Math.min(monthlyGenerationKwh, monthlyKwh);
  const monthlySavings = usableGeneration * rate;
  const annualSavings = monthlySavings * 12;

  // 8. Net metering excess (grid-tied only)
  const excessKwh = Math.max(0, monthlyGenerationKwh - monthlyKwh);
  const netMeteringCreditMonthly =
    input.systemType === 'grid-tied' ? excessKwh * GENERATION_CHARGE_RATE : 0;

  // 9. System cost lookup (use actual rounded system size)
  const [costLow, costHigh] = lookupSystemCost(input.systemType, actualSystemSizeKw);
  const costMid = Math.round((costLow + costHigh) / 2);

  // 10. Payback
  const paybackLow = annualSavings > 0 ? costLow / annualSavings : Infinity;
  const paybackHigh = annualSavings > 0 ? costHigh / annualSavings : Infinity;

  // 11. CO2
  const annualGenKwh = monthlyGenerationKwh * 12;
  const co2KgPerYear = annualGenKwh * CO2_FACTOR_KG_PER_KWH;
  const treesEquivalent = Math.round(co2KgPerYear / TREE_CO2_KG_PER_YEAR);

  // 12. Lifetime savings + chart data
  const { net: lifetimeSavings, projections } = computeLifetimeSavings(annualSavings, costMid);

  return {
    monthlyKwh: Math.round(monthlyKwh),
    systemSizeKw: Math.round(actualSystemSizeKw * 100) / 100,
    panelCount,
    monthlyGenerationKwh: Math.round(monthlyGenerationKwh),
    coveragePercent,

    monthlyElectricityRate: rate,

    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),

    systemCostLow: costLow,
    systemCostHigh: costHigh,
    systemCostMid: costMid,

    paybackLow: Math.round(paybackLow * 10) / 10,
    paybackHigh: Math.round(paybackHigh * 10) / 10,

    lifetimeSavings,
    co2ReductionKgPerYear: Math.round(co2KgPerYear),
    treesEquivalent,

    excessKwh: Math.round(excessKwh),
    netMeteringCreditMonthly: Math.round(netMeteringCreditMonthly),

    yearlyProjections: projections,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers (client-safe — no Intl dependencies)
// ---------------------------------------------------------------------------

export function formatPeso(amount: number): string {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
  }
  return `₱${amount}`;
}

export function formatPesoFull(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}
