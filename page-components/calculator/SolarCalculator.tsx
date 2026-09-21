'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Zap,
  Battery,
  WifiOff,
  MapPin,
  TrendingUp,
  Leaf,
  ChevronDown,
  RotateCcw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { FieldHint, Input, Label } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import CtaBand from '@/components/ui/CtaBand';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';
import {
  calculate,
  REGIONS,
  SYSTEM_TYPE_LABELS,
  SYSTEM_TYPE_DESCRIPTIONS,
  formatPeso,
  formatPesoFull,
  type RegionKey,
  type SystemType,
  type CalculatorResult,
} from '@/lib/solar-calculator';

// ---------------------------------------------------------------------------
// Count-up animation hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, active: boolean, duration = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration]);

  return value;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-fg-subtle hover:text-fg-muted transition-colors cursor-pointer rounded-full"
        aria-label="More info"
        type="button"
      >
        <Info size={12} aria-hidden />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-navy-950 text-white text-xs font-normal normal-case tracking-normal leading-relaxed px-3 py-2 rounded-control shadow-elevated z-50 pointer-events-none"
          >
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-950" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Coverage bar
// ---------------------------------------------------------------------------

function CoverageBar({ percent }: { percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="caps">Bill Coverage</span>
        <span className="text-xs font-bold text-solar-ink tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-solar-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payback timeline bar
// ---------------------------------------------------------------------------

function PaybackBar({ low, high }: { low: number; high: number }) {
  const midPercent = ((low + high) / 2 / 25) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="caps">Payback Timeline (25 yr)</span>
        <span className="text-xs font-bold text-fg tabular-nums">
          {low}–{high} yrs
        </span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-green-eco"
          initial={{ width: 0 }}
          animate={{ width: `${midPercent}%` }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {[0, 5, 10, 15, 20, 25].map((y) => (
          <span key={y} className="text-xs text-fg-subtle font-medium tabular-nums">
            {y}yr
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System type config
// ---------------------------------------------------------------------------

const SYSTEM_CONFIG: Record<
  SystemType,
  { icon: React.ReactNode; color: string; bg: string; border: string; accent: string }
> = {
  'grid-tied': {
    icon: <Sun size={18} strokeWidth={2} aria-hidden />,
    color: 'text-solar-ink',
    bg: 'bg-solar-50',
    border: 'border-solar-300',
    accent: 'bg-solar-500',
  },
  hybrid: {
    icon: <Battery size={18} strokeWidth={2} aria-hidden />,
    color: 'text-navy-700',
    bg: 'bg-navy-50',
    border: 'border-navy-300',
    accent: 'bg-navy-700',
  },
  'off-grid': {
    icon: <WifiOff size={18} strokeWidth={2} aria-hidden />,
    color: 'text-green-800',
    bg: 'bg-green-eco-bg',
    border: 'border-green-200',
    accent: 'bg-green-eco',
  },
};

// ---------------------------------------------------------------------------
// Savings chart — SVG with gradient fills
// ---------------------------------------------------------------------------

function SavingsChart({ result }: { result: CalculatorResult }) {
  const { yearlyProjections, systemCostMid } = result;

  const allValues = yearlyProjections.flatMap((p) => [
    p.cumulativeWithoutSolar,
    p.cumulativeWithSolar,
  ]);
  const maxVal = Math.max(...allValues, systemCostMid * 1.05);

  const W = 640;
  const H = 200;
  const PAD = { top: 24, right: 24, bottom: 40, left: 68 };

  const gW = W - PAD.left - PAD.right;
  const gH = H - PAD.top - PAD.bottom;

  const scaleX = (yr: number) => PAD.left + (yr / 25) * gW;
  const scaleY = (val: number) => PAD.top + (1 - val / maxVal) * gH;

  const toLinePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ');

  const toAreaPath = (vals: number[], baseline: number) => {
    const line = vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`)
      .join(' ');
    const close = `L${scaleX(vals.length - 1).toFixed(1)},${scaleY(baseline).toFixed(1)} L${scaleX(0).toFixed(1)},${scaleY(baseline).toFixed(1)} Z`;
    return `${line} ${close}`;
  };

  const withoutSolarVals = yearlyProjections.map((p) => p.cumulativeWithoutSolar);
  const withSolarVals = yearlyProjections.map((p) => p.cumulativeWithSolar);

  const paybackYear = yearlyProjections.findIndex((p, i) => i > 0 && p.cumulativeWithSolar === 0);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: maxVal * t,
    y: scaleY(maxVal * t),
  }));

  return (
    <div className="overflow-x-auto -mx-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="25-year cumulative savings comparison chart"
      >
        <defs>
          <linearGradient id="withoutGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-navy-900)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--color-navy-900)" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-solar-500)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-solar-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Subtle grid */}
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--color-slate-100)"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" fontSize={9} fill="var(--color-slate-500)">
              {formatPeso(tick.val)}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {[0, 5, 10, 15, 20, 25].map((yr) => (
          <text
            key={yr}
            x={scaleX(yr)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fontSize={9}
            fill="var(--color-slate-500)"
          >
            Yr {yr}
          </text>
        ))}

        {/* Area fills */}
        <path d={toAreaPath(withoutSolarVals, 0)} fill="url(#withoutGrad)" />
        <path d={toAreaPath(withSolarVals, 0)} fill="url(#solarGrad)" />

        {/* Lines */}
        <path
          d={toLinePath(withoutSolarVals)}
          fill="none"
          stroke="var(--color-navy-900)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={toLinePath(withSolarVals)}
          fill="none"
          stroke="var(--color-solar-500)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Payback marker */}
        {paybackYear > 0 && (
          <g>
            <line
              x1={scaleX(paybackYear)}
              x2={scaleX(paybackYear)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--color-green-eco)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <rect
              x={scaleX(paybackYear) - 20}
              y={PAD.top - 18}
              width={40}
              height={14}
              rx={4}
              fill="var(--color-green-eco)"
            />
            <text
              x={scaleX(paybackYear)}
              y={PAD.top - 8}
              textAnchor="middle"
              fontSize={8.5}
              fill="white"
              fontWeight="bold"
            >
              Paid off
            </text>
          </g>
        )}

        {/* End-point dots */}
        <circle
          cx={scaleX(25)}
          cy={scaleY(withoutSolarVals[25]!)}
          r={4}
          fill="var(--color-navy-900)"
          stroke="white"
          strokeWidth={2}
        />
        <circle
          cx={scaleX(25)}
          cy={scaleY(withSolarVals[25]!)}
          r={4}
          fill="var(--color-solar-500)"
          stroke="white"
          strokeWidth={2}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 justify-center flex-wrap">
        <div className="flex items-center gap-2 text-xs text-fg-subtle">
          <span className="w-6 h-[2px] bg-navy-900 inline-block rounded-full" aria-hidden />
          Without solar
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-subtle">
          <span className="w-6 h-[2.5px] bg-solar-500 inline-block rounded-full" aria-hidden />
          With solar
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-subtle">
          <span className="inline-block w-px h-4 border-l border-dashed border-green-eco" aria-hidden />
          Payback point
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SolarCalculator() {
  const [monthlyKwh, setMonthlyKwh] = useState('');
  const [region, setRegion] = useState<RegionKey>('eastern-visayas-ormoc');
  const [locationSearch, setLocationSearch] = useState<string>(REGIONS['eastern-visayas-ormoc'].label);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [systemType, setSystemType] = useState<SystemType>('grid-tied');
  const [calculated, setCalculated] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filteredRegions = (
    Object.entries(REGIONS) as [RegionKey, (typeof REGIONS)[RegionKey]][]
  ).filter(([, val]) =>
    val.label.toLowerCase().includes(locationSearch.toLowerCase()),
  );

  const canCalculate =
    Number(monthlyKwh.replace(/,/g, '')) > 0 &&
    (region !== 'other' || Number(customRate.replace(/,/g, '')) > 0);

  // Count-up for hero metric
  const animatedSavings = useCountUp(result?.monthlySavings ?? 0, calculated && !!result);

  function handleCalculate() {
    if (!canCalculate) return;
    const parsedKwh = Number(monthlyKwh.replace(/,/g, ''));
    const parsedRate = customRate ? Number(customRate.replace(/,/g, '')) : undefined;
    const res = calculate({
      monthlyKwh: parsedKwh,
      region,
      systemType,
      ...(parsedRate ? { customRate: parsedRate } : {}),
    });
    setResult(res);
    setCalculated(true);
    setTimeout(() => {
      document.getElementById('calc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function handleReset() {
    setMonthlyKwh('');
    setCustomRate('');
    setCalculated(false);
    setResult(null);
  }

  // Stagger animation for metric cards
  const cardAnim = (i: number) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE_OUT },
  });

  return (
    <Layout>
      <PageHero
        title="How much could you save with solar?"
        lead="Enter your monthly kWh usage. Get your estimated system size, savings, and payback period — tailored to your region."
      />

      <Section tone="tint">
        <motion.div
          className="bg-white rounded-panel shadow-card border border-line overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">

            {/* ──── Input panel ──── */}
            <div className="p-7 sm:p-9 lg:border-r border-b lg:border-b-0 border-line">

              <p className="caps mb-5">Step 1 — Your Details</p>

              {/* Consumption input (prefix adornment, so wired by hand instead of <Field>) */}
              <div className="mb-5">
                <Label htmlFor="consumption-input">Monthly Consumption</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle text-sm font-bold select-none" aria-hidden>
                    kWh
                  </span>
                  <Input
                    id="consumption-input"
                    type="text"
                    inputMode="decimal"
                    aria-describedby="consumption-input-hint"
                    value={monthlyKwh}
                    onChange={(e) =>
                      setMonthlyKwh(e.target.value.replace(/[^0-9.,]/g, ''))
                    }
                    placeholder="362"
                    className="pl-14 font-bold tabular-nums"
                  />
                </div>
                <FieldHint id="consumption-input-hint">
                  Find this on your bill under &quot;kWh used this period&quot;
                </FieldHint>
              </div>

              {/* Location */}
              <div className="mb-6" ref={locationRef}>
                <Label htmlFor="location-search">
                  <MapPin size={12} className="inline mr-1 -mt-px text-fg-subtle" aria-hidden />
                  Location / Utility
                </Label>
                <div className="relative">
                  <Input
                    id="location-search"
                    type="text"
                    autoComplete="off"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="Search location or utility…"
                    className="pr-10 font-semibold"
                  />
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    aria-hidden
                  />
                  {showLocationDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-line rounded-control shadow-elevated overflow-hidden">
                      <div className="max-h-52 overflow-y-auto">
                        {filteredRegions.length > 0 ? (
                          filteredRegions.map(([key, val]) => (
                            <button
                              key={key}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRegion(key);
                                setLocationSearch(val.label);
                                setShowLocationDropdown(false);
                                if (key !== 'other') setCustomRate('');
                              }}
                              className={cn(
                                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                region === key
                                  ? 'bg-solar-50 text-solar-ink font-semibold'
                                  : 'text-fg hover:bg-slate-50',
                              )}
                            >
                              {val.label}
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setRegion('other');
                              setLocationSearch(REGIONS.other.label);
                              setShowLocationDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-fg-muted hover:bg-slate-50"
                          >
                            Other / Not listed
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rate — always visible; read-only for known regions, editable for Other */}
                <div className="mt-4">
                  <Label htmlFor="custom-rate">Your Rate (₱ / kWh)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle text-sm font-bold select-none" aria-hidden>
                      ₱
                    </span>
                    <Input
                      id="custom-rate"
                      type="text"
                      inputMode="decimal"
                      readOnly={region !== 'other'}
                      aria-describedby={region === 'other' ? 'custom-rate-hint' : undefined}
                      value={
                        region !== 'other'
                          ? REGIONS[region].rate.toString()
                          : customRate
                      }
                      onChange={(e) =>
                        region === 'other' &&
                        setCustomRate(e.target.value.replace(/[^0-9.,]/g, ''))
                      }
                      placeholder="12.00"
                      className={cn(
                        'pl-8 font-bold tabular-nums',
                        region !== 'other' &&
                          'border-slate-200 bg-slate-50 text-fg-muted cursor-default select-none hover:border-slate-200',
                      )}
                    />
                  </div>
                  {region === 'other' && (
                    <FieldHint id="custom-rate-hint">
                      Check your monthly bill for the rate per kWh
                    </FieldHint>
                  )}
                </div>
              </div>

              {/* System type */}
              <fieldset className="mb-7">
                <legend className="mb-3 text-sm font-semibold text-fg">System Type</legend>
                <div className="flex flex-col gap-2">
                  {(Object.keys(SYSTEM_TYPE_LABELS) as SystemType[]).filter((t) => t !== 'off-grid').map((type) => {
                    const cfg = SYSTEM_CONFIG[type];
                    const active = systemType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSystemType(type)}
                        className={cn(
                          'relative flex items-start gap-3 px-4 py-3.5 rounded-control border-2 text-left transition-colors duration-200 cursor-pointer overflow-hidden',
                          active
                            ? `${cfg.border} ${cfg.bg}`
                            : 'border-line hover:border-slate-300 bg-white hover:bg-slate-50',
                        )}
                      >
                        {/* Left accent bar */}
                        <motion.div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent} rounded-r-sm`}
                          initial={false}
                          animate={{ scaleY: active ? 1 : 0 }}
                          transition={{ duration: 0.2, ease: EASE_OUT }}
                        />
                        <span
                          className={cn(
                            'flex-shrink-0 mt-0.5 transition-colors duration-200',
                            active ? cfg.color : 'text-slate-500',
                          )}
                        >
                          {cfg.icon}
                        </span>
                        <div className="min-w-0 pr-5">
                          <p className={cn('text-sm font-bold transition-colors duration-200', active ? cfg.color : 'text-fg')}>
                            {SYSTEM_TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">
                            {SYSTEM_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2
                            size={15}
                            className={`absolute right-3 top-3 flex-shrink-0 ${cfg.color}`}
                            aria-hidden
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* CTA */}
              <div className="flex flex-col gap-2.5">
                <Button size="lg" fullWidth onClick={handleCalculate} disabled={!canCalculate}>
                  <Zap className="size-4" aria-hidden />
                  Calculate My Savings
                </Button>

                <AnimatePresence>
                  {calculated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    >
                      <Button variant="ghost" size="sm" fullWidth onClick={handleReset} className="text-fg-muted">
                        <RotateCcw className="size-3.5" aria-hidden />
                        Start over
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ──── Results panel ──── */}
            <div className="p-7 sm:p-9 bg-navy-50/60">
              <AnimatePresence mode="wait">
                {!calculated || !result ? (
                  /* Placeholder state */
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    className="h-full min-h-[400px] flex flex-col items-center justify-center text-center py-8"
                  >
                    <div className="mb-6 grid size-20 place-items-center rounded-card bg-solar-50 text-solar-600">
                      <Sun size={36} aria-hidden />
                    </div>
                    <h2 className="text-h3 text-fg mb-2">Your results await</h2>
                    <p className="text-fg-muted text-sm max-w-xs leading-relaxed">
                      Enter your monthly kWh usage and location on the left, then hit{' '}
                      <strong className="text-fg">Calculate My Savings</strong>.
                    </p>

                    {/* Preview cards skeleton */}
                    <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs opacity-40 pointer-events-none select-none" aria-hidden>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-control h-16 border border-line" />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Results state */
                  <motion.div
                    key="results"
                    id="calc-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  >
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                      Step 2 — Your Estimated Results
                    </h2>

                    {/* ── Hero savings metric ── */}
                    <motion.div
                      {...cardAnim(0)}
                      className="surface-dark bg-navy-900 rounded-card p-6 mb-4"
                    >
                      <p className="text-fg-muted text-xs font-semibold uppercase tracking-wide mb-1">
                        Estimated Monthly Savings
                      </p>
                      <div className="flex items-end gap-2 mb-1">
                        <span className="font-display text-h1 text-solar-ink tabular-nums">
                          ₱{animatedSavings.toLocaleString()}
                        </span>
                        <span className="text-fg-subtle text-sm font-medium mb-1.5">/mo</span>
                      </div>
                      <p className="text-fg-muted text-xs tabular-nums">
                        ₱{result.annualSavings.toLocaleString()} per year
                        {' · '}
                        At ₱{result.monthlyElectricityRate}/kWh
                      </p>

                      {/* Coverage bar inside hero */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-fg-subtle text-xs font-semibold uppercase tracking-wide">
                            Bill Coverage
                          </span>
                          <span className="text-solar-ink text-xs font-bold tabular-nums">
                            {result.coveragePercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-solar-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${result.coveragePercent}%` }}
                            transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* ── Key metrics grid ── */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        {
                          label: 'System Size',
                          value: `${result.systemSizeKw} kW`,
                          sub: `${result.panelCount} panels · 550 Wp`,
                          tooltip: 'Sized to fully offset your monthly consumption.',
                        },
                        {
                          label: 'Monthly Generation',
                          value: `${result.monthlyGenerationKwh} kWh`,
                          sub: 'Estimated solar output',
                        },
                        {
                          label: 'Estimated Cost',
                          value: `${formatPeso(result.systemCostLow)}–${formatPeso(result.systemCostHigh)}`,
                          sub: 'Fully installed',
                          tooltip: 'Market average 2026. May vary by brand and location.',
                        },
                        {
                          label: '25-Year Net Savings',
                          value: formatPeso(result.lifetimeSavings),
                          sub: 'After deducting system cost',
                          tooltip: '4% annual rate increase + 0.5%/yr panel degradation factored in.',
                        },
                      ].map((card, i) => (
                        <motion.div
                          key={card.label}
                          {...cardAnim(i + 1)}
                          className="bg-white rounded-control px-4 py-4 border border-line shadow-soft"
                        >
                          <div className="caps mb-1.5 flex items-center">
                            {card.label}
                            {card.tooltip && <Tooltip text={card.tooltip} />}
                          </div>
                          <p className="font-display text-xl font-extrabold text-fg tabular-nums">
                            {card.value}
                          </p>
                          {card.sub && (
                            <p className="text-fg-subtle text-xs mt-0.5">{card.sub}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* ── Payback bar ── */}
                    <motion.div
                      {...cardAnim(5)}
                      className="bg-white rounded-control px-5 py-4 border border-line shadow-soft mb-3"
                    >
                      <PaybackBar low={result.paybackLow} high={result.paybackHigh} />
                    </motion.div>

                    {/* ── CO2 badge ── */}
                    <motion.div
                      {...cardAnim(6)}
                      className="flex items-center gap-4 bg-green-eco-bg border border-green-200 rounded-control px-5 py-4 mb-3"
                    >
                      <div className="w-10 h-10 bg-white rounded-control flex items-center justify-center flex-shrink-0">
                        <Leaf size={18} className="text-green-800" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                          Environmental Impact
                        </p>
                        <p className="text-fg font-semibold text-sm mt-0.5 tabular-nums">
                          {result.co2ReductionKgPerYear.toLocaleString()} kg CO₂ avoided/yr
                          <span className="text-fg-muted font-normal">
                            {' ≈ '}
                            <strong className="text-green-800">
                              {result.treesEquivalent} trees
                            </strong>{' '}
                            planted
                          </span>
                        </p>
                      </div>
                    </motion.div>

                    {/* ── Net metering callout ── */}
                    <AnimatePresence>
                      {systemType === 'grid-tied' && result.excessKwh > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: DURATION.base, ease: EASE_OUT }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="bg-white border border-navy-100 rounded-control px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-navy-700 mb-1">
                              Net Metering Credit
                            </p>
                            <p className="text-fg font-semibold text-sm tabular-nums">
                              ~{formatPesoFull(result.netMeteringCreditMonthly)}/mo from{' '}
                              {result.excessKwh} kWh excess exported
                            </p>
                            <p className="text-xs text-fg-subtle mt-1 leading-relaxed">
                              Credits at gen rate (~₱6.50/kWh), not full retail. Resets annually.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Disclaimer */}
                    <p className="text-xs text-fg-muted leading-relaxed">
                      * Estimates based on regional averages. Actual savings vary with roof
                      orientation, shading, and installer pricing.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Savings chart ── */}
        <AnimatePresence>
          {calculated && result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }}
              className="mt-6 bg-white rounded-panel shadow-soft border border-line p-7 sm:p-10"
            >
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <p className="caps mb-1">25-Year Projection</p>
                  <h2 className="text-h3 text-fg">Cumulative Cost Comparison</h2>
                </div>
                <Badge tone="success" className="px-3.5 py-1.5">
                  <TrendingUp size={13} aria-hidden />
                  <span className="tabular-nums">
                    Payback in {result.paybackLow}–{result.paybackHigh} years
                  </span>
                </Badge>
              </div>
              <SavingsChart result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <CtaBand
        title="Ready to go solar?"
        body="Get a free on-site assessment and accurate quote from our team."
      />
    </Layout>
  );
}
