/**
 * JMC Solar Calculator — Calculation Engine
 * Pure functions, fully typed. No side effects.
 */

// ---------------------------------------------------------------------------
// Region data
// ---------------------------------------------------------------------------

export const REGIONS = {
  'metro-manila': { label: 'Metro Manila / NCR', rate: 14.35, psh: 4.75, genCharge: 8.39, costMultiplier: 1.12 },
  'bulacan-rizal-cavite': { label: 'Bulacan / Rizal / Cavite', rate: 14.35, psh: 4.75, genCharge: 8.39, costMultiplier: 1.12 },
  'cebu-city': { label: 'Cebu City', rate: 12.57, psh: 4.6, genCharge: 7.42 },
  'cebu-province': { label: 'Cebu Province', rate: 13.0, psh: 4.5, genCharge: 7.00 },
  'davao-city': { label: 'Davao City', rate: 10.53, psh: 5.2, genCharge: 6.12 },
  'mindanao-general': { label: 'General Santos / Mindanao', rate: 10.80, psh: 5.2, genCharge: 6.50 },
  'cdo': { label: 'Cagayan de Oro', rate: 11.50, psh: 5.0, genCharge: 6.50 },
  'baguio': { label: 'Baguio / Benguet', rate: 11.60, psh: 4.6, genCharge: 6.50 },
  'iloilo': { label: 'Iloilo', rate: 10.74, psh: 5.0, genCharge: 5.90 },
  'palawan': { label: 'Palawan', rate: 12.0, psh: 4.75, genCharge: 6.50 },
  'negros': { label: 'Negros (Negros Power)', rate: 12.25, psh: 4.8, genCharge: 7.00 },
  'zamboanga': { label: 'Zamboanga (ZAMCELCO)', rate: 12.30, psh: 4.9, genCharge: 6.50 },
  'iligan': { label: 'Iligan (ILIGAN LIGHT)', rate: 10.20, psh: 5.0, genCharge: 6.50 },
  'pampanga': { label: 'Pampanga (SFELAPCO / PELCO II)', rate: 11.75, psh: 4.7, genCharge: 7.00, costMultiplier: 1.08 },
  'batangas': { label: 'Batangas (BATELEC I)', rate: 11.80, psh: 4.8, genCharge: 7.00 },
  'eastern-visayas-tacloban': { label: 'Eastern Visayas – Tacloban (LEYECO II)', rate: 10.07, psh: 4.5, genCharge: 6.50 },
  'eastern-visayas-ormoc': { label: 'Eastern Visayas – Ormoc (LEYECO V)', rate: 14.50, psh: 4.5, genCharge: 6.50 },
  'eastern-visayas-other': { label: 'Eastern Visayas – Other (LEYECO III/IV)', rate: 13.80, psh: 4.5, genCharge: 6.50 },
  'samar-west': { label: 'Samar – West (SAMELCO I)', rate: 12.80, psh: 4.3, genCharge: 6.50 },
  'samar-east': { label: 'Samar – East (SAMELCO II / ESAMELCO)', rate: 14.50, psh: 4.3, genCharge: 6.50 },
  'other': { label: 'Other / Not listed', rate: 12.0, psh: 4.5, genCharge: 6.50 },
} as const satisfies Record<string, { label: string; rate: number; psh: number; genCharge: number; costMultiplier?: number }>;

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
  [1.5,       50_000,    75_000],
  [2.5,       95_000,   145_000],
  [4.0,      150_000,   210_000],
  [6.5,      230_000,   340_000],
  [9.0,      320_000,   470_000],
  [Infinity, 400_000,   600_000],
] as const;

const HYBRID_COSTS: readonly CostBracket[] = [
  [1.5,       95_000,   140_000],
  [2.5,      140_000,   210_000],
  [4.0,      200_000,   290_000],
  [6.5,      300_000,   450_000],
  [9.0,      420_000,   620_000],
  [Infinity, 520_000,   780_000],
] as const;

const OFF_GRID_COSTS: readonly CostBracket[] = [
  [1.5,      150_000,   230_000],
  [2.5,      240_000,   360_000],
  [4.0,      380_000,   550_000],
  [6.5,      600_000,   880_000],
  [9.0,      850_000, 1_250_000],
  [Infinity,1_100_000, 1_600_000],
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
  /** kWp per panel, default 0.55 */
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

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

function lookupSystemCost(
  systemType: SystemType,
  systemSizeKw: number,
  costMultiplier = 1.0,
): [low: number, high: number] {
  const brackets = SYSTEM_COST_TABLE[systemType];
  for (const [maxKw, low, high] of brackets) {
    if (systemSizeKw <= maxKw) {
      return [Math.round(low * costMultiplier), Math.round(high * costMultiplier)];
    }
  }
  const last = brackets[brackets.length - 1]!;
  return [Math.round(last[1] * costMultiplier), Math.round(last[2] * costMultiplier)];
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
  const panelWattageKw = (input.panelWattage ?? 550) / 1000;
  const efficiency = input.efficiencyFactor ?? 0.78;
  const rate = region.rate;
  const psh = region.psh;
  const genCharge = region.genCharge;

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
    input.systemType === 'grid-tied' ? excessKwh * genCharge : 0;

  // 9. System cost lookup (use actual rounded system size)
  const [costLow, costHigh] = lookupSystemCost(
    input.systemType,
    actualSystemSizeKw,
    'costMultiplier' in region ? region.costMultiplier : 1.0,
  );
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
