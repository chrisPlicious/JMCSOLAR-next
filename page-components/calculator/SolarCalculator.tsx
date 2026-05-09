'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Zap,
  Battery,
  WifiOff,
  MapPin,
  TrendingUp,
  Leaf,
  ArrowRight,
  ChevronDown,
  Calculator,
  RotateCcw,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
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
        className="text-slate-400 hover:text-slate-500 transition-colors cursor-pointer"
        aria-label="More info"
        type="button"
      >
        <Info size={12} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-navy-950 text-white text-[11px] leading-relaxed px-3 py-2 rounded-xl shadow-xl z-50 pointer-events-none"
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
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Bill Coverage
        </span>
        <span className="text-[11px] font-bold text-solar-600">{percent}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-solar-400 to-solar-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
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
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Payback Timeline (25 yr)
        </span>
        <span className="text-[11px] font-bold text-navy-900">
          {low}–{high} yrs
        </span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${midPercent}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {[0, 5, 10, 15, 20, 25].map((y) => (
          <span key={y} className="text-[9px] text-slate-300 font-medium">
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
    icon: <Sun size={18} strokeWidth={2} />,
    color: 'text-solar-600',
    bg: 'bg-solar-50',
    border: 'border-solar-200',
    accent: 'bg-solar-500',
  },
  hybrid: {
    icon: <Battery size={18} strokeWidth={2} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
  },
  'off-grid': {
    icon: <WifiOff size={18} strokeWidth={2} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
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
            <stop offset="0%" stopColor="#0f1f40" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0f1f40" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
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
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">
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
            fill="#94a3b8"
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
          stroke="#0f1f40"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={toLinePath(withSolarVals)}
          fill="none"
          stroke="#f59e0b"
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
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <rect
              x={scaleX(paybackYear) - 20}
              y={PAD.top - 18}
              width={40}
              height={14}
              rx={4}
              fill="#10b981"
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
          fill="#0f1f40"
          stroke="white"
          strokeWidth={2}
        />
        <circle
          cx={scaleX(25)}
          cy={scaleY(withSolarVals[25]!)}
          r={4}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={2}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 justify-center flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="w-6 h-[2px] bg-navy-900 inline-block rounded-full" />
          Without solar
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="w-6 h-[2.5px] bg-solar-500 inline-block rounded-full" />
          With solar
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-block w-px h-4 border-l border-dashed border-emerald-500" />
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
  const [inputMode, setInputMode] = useState<'kwh' | 'peso'>('peso');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [monthlyKwh, setMonthlyKwh] = useState('');
  const [region, setRegion] = useState<RegionKey>('metro-manila');
  const [systemType, setSystemType] = useState<SystemType>('grid-tied');
  const [calculated, setCalculated] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const canCalculate =
    (inputMode === 'peso' && Number(monthlyBill) > 0) ||
    (inputMode === 'kwh' && Number(monthlyKwh) > 0);

  // Count-up for hero metric
  const animatedSavings = useCountUp(result?.monthlySavings ?? 0, calculated && !!result);

  function handleCalculate() {
    if (!canCalculate) return;
    const res = calculate({
      consumption:
        inputMode === 'peso'
          ? { mode: 'peso', monthlyBill: Number(monthlyBill) }
          : { mode: 'kwh', monthlyKwh: Number(monthlyKwh) },
      region,
      systemType,
    });
    setResult(res);
    setCalculated(true);
    setTimeout(() => {
      document.getElementById('calc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function handleReset() {
    setMonthlyBill('');
    setMonthlyKwh('');
    setCalculated(false);
    setResult(null);
  }

  const sys = SYSTEM_CONFIG[systemType];

  // Stagger animation for metric cards
  const cardAnim = (i: number) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
  });

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 pb-24 md:pb-28 pt-32 px-4 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-white/40 text-sm mb-10 font-medium">
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/70">Solar Calculator</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-solar-500/20 rounded-2xl flex items-center justify-center ring-1 ring-solar-500/30">
                <Calculator size={22} className="text-solar-400" />
              </div>
              <span className="text-solar-400 text-sm font-bold uppercase tracking-widest">
                Free Tool
              </span>
            </div>

            <h1
              className="text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              How much could you
              <br />
              <span className="text-solar-400">save with solar?</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
              Enter your electric bill. Get your estimated savings, system size,
              and payback period — tailored to your region.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Calculator ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 mt-6 pb-16">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl shadow-navy-900/10 border border-slate-100/80 overflow-hidden"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">

            {/* ──── Input panel ──── */}
            <div className="p-7 sm:p-9 lg:border-r border-b lg:border-b-0 border-slate-100">

              {/* Section label */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4">
                Step 1 — Your Details
              </p>

              {/* Input mode toggle */}
              <div className="relative flex bg-slate-100 rounded-2xl p-1 mb-6">
                <motion.div
                  className="absolute inset-y-1 rounded-xl bg-white shadow-sm"
                  layout
                  layoutId="toggleBg"
                  style={{ width: 'calc(50% - 4px)', left: inputMode === 'peso' ? 4 : 'calc(50%)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
                {(['peso', 'kwh'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 cursor-pointer ${
                      inputMode === mode ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {mode === 'peso' ? '₱ Monthly Bill' : 'kWh Usage'}
                  </button>
                ))}
              </div>

              {/* Consumption input */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={inputMode}
                    initial={{ opacity: 0, x: inputMode === 'peso' ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <label
                      htmlFor="consumption-input"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2"
                    >
                      {inputMode === 'peso' ? 'Monthly Electric Bill' : 'Monthly Consumption'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">
                        {inputMode === 'peso' ? '₱' : 'kWh'}
                      </span>
                      <input
                        id="consumption-input"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={inputMode === 'peso' ? monthlyBill : monthlyKwh}
                        onChange={(e) =>
                          inputMode === 'peso'
                            ? setMonthlyBill(e.target.value)
                            : setMonthlyKwh(e.target.value)
                        }
                        placeholder={inputMode === 'peso' ? '5,000' : '362'}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-navy-900 font-bold text-lg focus:outline-none focus:border-solar-400 focus:ring-4 focus:ring-solar-400/10 transition-all duration-200 placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {inputMode === 'peso'
                        ? 'Total amount on your monthly Meralco / utility bill'
                        : 'Find this on your bill under "kWh used this period"'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label
                  htmlFor="region-select"
                  className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2"
                >
                  <MapPin size={10} className="inline mr-1 -mt-px" />
                  Location / Utility
                </label>
                <div className="relative">
                  <select
                    id="region-select"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionKey)}
                    className="w-full appearance-none pl-4 pr-10 py-3.5 border-2 border-slate-200 rounded-2xl text-navy-900 font-semibold text-sm focus:outline-none focus:border-solar-400 focus:ring-4 focus:ring-solar-400/10 transition-all duration-200 bg-white cursor-pointer"
                  >
                    {(Object.entries(REGIONS) as [RegionKey, (typeof REGIONS)[RegionKey]][]).map(
                      ([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* System type */}
              <div className="mb-7">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  System Type
                </p>
                <div className="flex flex-col gap-2">
                  {(Object.keys(SYSTEM_TYPE_LABELS) as SystemType[]).map((type) => {
                    const cfg = SYSTEM_CONFIG[type];
                    const active = systemType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSystemType(type)}
                        className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                          active
                            ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1 ${cfg.border.replace('border', 'ring')}`
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Left accent bar */}
                        <motion.div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent} rounded-r-sm`}
                          initial={false}
                          animate={{ scaleY: active ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        />
                        <span
                          className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                            active ? cfg.color : 'text-slate-400'
                          }`}
                        >
                          {cfg.icon}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold transition-colors duration-200 ${active ? cfg.color : 'text-navy-900'}`}>
                            {SYSTEM_TYPE_LABELS[type]}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {SYSTEM_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2
                            size={15}
                            className={`absolute right-3 top-3 flex-shrink-0 ${cfg.color}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                    canCalculate
                      ? 'bg-solar-500 hover:bg-solar-400 text-white shadow-lg shadow-solar-500/25 hover:shadow-solar-400/35 hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Zap size={18} className={canCalculate ? 'text-white' : 'text-slate-400'} />
                  Calculate My Savings
                </button>

                <AnimatePresence>
                  {calculated && (
                    <motion.button
                      type="button"
                      onClick={handleReset}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full py-2.5 rounded-2xl font-semibold text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      Start over
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ──── Results panel ──── */}
            <div className="p-7 sm:p-9 bg-slate-50/50">
              <AnimatePresence mode="wait">
                {!calculated || !result ? (
                  /* Placeholder state */
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full min-h-[400px] flex flex-col items-center justify-center text-center py-8"
                  >
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-solar-400/20 to-solar-500/10 rounded-3xl flex items-center justify-center">
                        <Sun size={40} className="text-solar-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-navy-900 rounded-xl flex items-center justify-center">
                        <Sparkles size={13} className="text-solar-400" />
                      </div>
                    </div>
                    <h3
                      className="text-navy-900 font-black text-2xl mb-2"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      Your results await
                    </h3>
                    <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                      Enter your monthly bill and location on the left, then hit{' '}
                      <strong className="text-navy-900">Calculate My Savings</strong>.
                    </p>

                    {/* Preview cards skeleton */}
                    <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs opacity-30 pointer-events-none select-none">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl h-16 border border-slate-200" />
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
                    transition={{ duration: 0.3 }}
                  >
                    {/* Section label */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-4">
                      Step 2 — Your Estimated Results
                    </p>

                    {/* ── Hero savings metric ── */}
                    <motion.div
                      {...cardAnim(0)}
                      className="relative bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 mb-4 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-solar-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                      <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-1">
                        Estimated Monthly Savings
                      </p>
                      <div className="flex items-end gap-2 mb-1">
                        <span
                          className="text-solar-400 font-black text-4xl sm:text-5xl leading-none"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          ₱{animatedSavings.toLocaleString()}
                        </span>
                        <span className="text-white/40 text-sm font-medium mb-1.5">/mo</span>
                      </div>
                      <p className="text-white/50 text-xs">
                        ₱{result.annualSavings.toLocaleString()} per year
                        {' · '}
                        At ₱{result.monthlyElectricityRate}/kWh
                      </p>

                      {/* Coverage bar inside hero */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            Bill Coverage
                          </span>
                          <span className="text-solar-400 text-[11px] font-bold">
                            {result.coveragePercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-solar-400 to-solar-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${result.coveragePercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
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
                          className="bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm"
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                            {card.label}
                            {card.tooltip && <Tooltip text={card.tooltip} />}
                          </div>
                          <p
                            className="text-navy-900 font-black text-base leading-tight"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {card.value}
                          </p>
                          {card.sub && (
                            <p className="text-slate-400 text-[11px] mt-0.5">{card.sub}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* ── Payback bar ── */}
                    <motion.div
                      {...cardAnim(5)}
                      className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm mb-3"
                    >
                      <PaybackBar low={result.paybackLow} high={result.paybackHigh} />
                    </motion.div>

                    {/* ── CO2 badge ── */}
                    <motion.div
                      {...cardAnim(6)}
                      className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-3"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Leaf size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                          Environmental Impact
                        </p>
                        <p className="text-navy-900 font-semibold text-sm mt-0.5">
                          {result.co2ReductionKgPerYear.toLocaleString()} kg CO₂ avoided/yr
                          <span className="text-slate-500 font-normal">
                            {' ≈ '}
                            <strong className="text-emerald-600">
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
                          className="overflow-hidden mb-3"
                        >
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                              Net Metering Credit
                            </p>
                            <p className="text-navy-900 font-semibold text-sm">
                              ~{formatPesoFull(result.netMeteringCreditMonthly)}/mo from{' '}
                              {result.excessKwh} kWh excess exported
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              Credits at gen rate (~₱6.50/kWh), not full retail. Resets annually.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-slate-400 leading-relaxed">
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
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 bg-white rounded-3xl shadow-sm border border-slate-100 p-7 sm:p-10"
            >
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-1">
                    25-Year Projection
                  </p>
                  <h3
                    className="text-navy-900 font-black text-xl"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cumulative Cost Comparison
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 rounded-full px-3.5 py-2 text-xs font-bold border border-emerald-100">
                  <TrendingUp size={13} />
                  Payback in {result.paybackLow}–{result.paybackHigh} years
                </div>
              </div>
              <SavingsChart result={result} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA ── */}
        <motion.div
          className="mt-6 relative bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center overflow-hidden"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-solar-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-solar-500/15 text-solar-400 rounded-full px-4 py-1.5 text-xs font-bold mb-5 border border-solar-500/20">
              <Sparkles size={12} />
              Free — no obligations
            </div>
            <h2
              className="text-white font-black text-2xl sm:text-3xl mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Ready to go solar?
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Get a free on-site assessment and accurate quote from our team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-solar-500/25 hover:-translate-y-0.5 hover:shadow-solar-400/35"
              >
                Get a Free Quote <ArrowRight size={17} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white font-semibold transition-colors duration-200 text-sm"
              >
                View our services →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
