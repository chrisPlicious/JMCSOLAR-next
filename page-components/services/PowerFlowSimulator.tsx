'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Moon, Pause, Play, RotateCcw, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildRoutes,
  clockTime,
  DAY_SECONDS,
  DAY_START,
  kw,
  OPENING_HOUR,
  pointAt,
  resetDay,
  RESET_HOUR,
  settle,
  startAt,
  arrayForLoad,
  withLoad,
  tickDay,
  type Flow,
  type FlowColor,
  type LabelSide,
  type Layout,
  type LayoutName,
  type Route,
  type Snapshot,
} from '@/lib/power-flow/engine';
import { SYSTEMS, type KpiView, type MixSegment, type NodeView, type SystemId } from '@/lib/power-flow/systems';

// Diagram card width (px) → arrangement: the tall phone diagram, the compact one
// used beside the controls, or the full-width one. Each keeps its text near 1:1.
function layoutFor(cardWidth: number): LayoutName {
  if (cardWidth < 600) return 'narrow';
  if (cardWidth < 880) return 'compact';
  return 'wide';
}

// ── Diagram pieces (viewBox units, 24-unit icon grid) ──────────
type Tile = 'solar' | 'battery' | 'grid' | 'meter' | 'home';

const NAMES: Record<Tile, string> = {
  solar: 'SOLAR PANELS',
  battery: 'BATTERY',
  grid: 'UTILITY GRID',
  meter: 'NET METER',
  home: 'HOME',
};

const TONE: Record<Tile, { stroke: string; halo: string; icon: string }> = {
  solar: { stroke: 'stroke-solar-500', halo: 'fill-solar-500', icon: 'stroke-solar-700' },
  battery: { stroke: 'stroke-green-600', halo: 'fill-green-600', icon: 'stroke-green-700' },
  grid: { stroke: 'stroke-navy-500', halo: 'fill-navy-500', icon: 'stroke-navy-500' },
  meter: { stroke: 'stroke-navy-700', halo: 'fill-navy-500', icon: '' },
  home: { stroke: 'stroke-navy-700', halo: 'fill-navy-500', icon: 'stroke-navy-700' },
};

const ICONS: Record<Exclude<Tile, 'meter'>, ReactNode> = {
  solar: (
    <>
      <circle cx="12" cy="7" r="2.6" />
      <path d="M12 1.6v1.1M6.6 7H5.5M18.5 7h-1.1M8.2 3.2l.8.8M15.8 3.2l-.8.8" />
      <path d="M4 14h16l-2 7H6z" />
      <path d="M5.2 17.5h13.6M9.3 14l-.9 7M14.7 14l.9 7" />
    </>
  ),
  battery: (
    <>
      <rect x="7" y="4" width="10" height="17" rx="2" />
      <path d="M10 2h4" />
    </>
  ),
  home: (
    <>
      <path d="M3 11 12 3.5 21 11" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  grid: <path d="M12 2 7 22M12 2l5 20M6 7h12M5 12h14M8.5 16l8 4M15.5 16l-8 4" />,
};

const INVERTER_ICON = (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M6.5 12c1.2-2.6 2.4-2.6 3.6 0s2.4 2.6 3.6 0 2.4-2.6 3.6 0" />
  </>
);

const ICON_STROKE = { strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Halo({ x, y, hw, hh, active, className }: { x: number; y: number; hw: number; hh: number; active?: boolean; className: string }) {
  return (
    <rect
      x={x - hw - 10}
      y={y - hh - 10}
      width={2 * hw + 20}
      height={2 * hh + 20}
      rx={22}
      fillOpacity={0.2}
      className={cn('transition-opacity duration-300', active ? 'animate-pulse' : 'opacity-0', className)}
    />
  );
}

/** Name pill, value and status line, stacked away from the device's wire. */
function Labels({
  name,
  side,
  x,
  y,
  hw,
  hh,
  view,
  pillStroke,
}: {
  name: string;
  side: LabelSide;
  x: number;
  y: number;
  hw: number;
  hh: number;
  view: NodeView;
  pillStroke: string;
}) {
  const textRef = useRef<SVGTextElement>(null);
  const [w, setW] = useState(name.length * 8 + 26);

  // The pill hugs its text; re-measure once the web font has loaded.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => setW(el.getComputedTextLength() + 26);
    measure();
    document.fonts?.ready.then(measure);
  }, [name]);

  let tx = x;
  let anchor: 'middle' | 'end' = 'middle';
  let px = x - w / 2;
  let py = side === 'above' ? y - hh - 32 : y + hh + 10;
  let ptx = x;
  if (side === 'left') {
    tx = x - hw - 12;
    anchor = 'end';
    px = tx - w;
    py = y - 30;
    ptx = tx - w / 2;
  }
  const valY = { above: y - hh - 60, below: y + hh + 56, left: y + 14 }[side];
  // The meter has no value line (its LCD shows it), so its status takes that slot.
  const subY = view.value === undefined ? valY - (side === 'below' ? 12 : 0) : { above: y - hh - 42, below: y + hh + 75, left: y + 32 }[side];

  return (
    <>
      <rect x={px} y={py} width={w} height={24} rx={12} strokeWidth={1.5} className={cn('fill-white', pillStroke)} />
      <text
        ref={textRef}
        x={ptx}
        y={py + 12.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        letterSpacing="0.1em"
        className="fill-fg"
      >
        {name}
      </text>
      {view.value !== undefined && (
        <text x={tx} y={valY} textAnchor={anchor} fontSize={17} fontWeight={600} className="fill-fg font-mono">
          {view.value}
        </text>
      )}
      <text
        x={tx}
        y={subY}
        textAnchor={anchor}
        fontSize={12.5}
        fontWeight={view.subTone ? 600 : 500}
        className={view.subTone === 'warn' ? 'fill-solar-700' : view.subTone === 'alert' ? 'fill-red-600' : 'fill-fg-muted'}
      >
        {view.sub}
      </text>
    </>
  );
}

function TileNode({ device, layout, view, tick }: { device: Tile; layout: Layout; view: NodeView; tick: number }) {
  const [x, y] = layout.nodes[device]!;
  const [hw, hh] = device === 'meter' ? layout.meter : [layout.tile, layout.tile];
  const tone = TONE[device];
  const s = layout.iconScale;
  const level = view.level ?? 0;
  const levelFill = view.low ? 'fill-solar-500' : 'fill-green-600';
  // Only the grid tile goes grey and dashed in a brownout; the meter just blanks its LCD.
  const cut = device === 'grid' && view.down;
  const stroke = view.alert ? 'stroke-red-600' : cut ? 'stroke-navy-300' : tone.stroke;
  // Battery: charge bar along the bottom of the tile, ticked at its reserve.
  const bar = { x: x - hw + 10, w: 2 * hw - 20, y: y + hh - 12 };
  const tickX = bar.x + (bar.w * tick) / 100;

  return (
    <g className={cn(view.off && 'opacity-50')}>
      <Halo x={x} y={y} hw={hw} hh={hh} active={view.active} className={tone.halo} />
      <rect
        x={x - hw}
        y={y - hh}
        width={2 * hw}
        height={2 * hh}
        rx={device === 'meter' ? 10 : 16}
        strokeWidth={2.5}
        strokeDasharray={cut ? '6 5' : undefined}
        className={cn('fill-white transition-[stroke] duration-200', stroke)}
      />
      {device === 'meter' ? (
        <>
          <rect x={x - hw + 8} y={y - hh + 8} width={2 * hw - 16} height={hh + 4} rx={4} className="fill-navy-950" />
          <text
            x={x}
            y={y - hh + 8 + (hh + 4) / 2 + 5}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            className={cn('font-mono', view.down ? 'fill-navy-300' : 'fill-solar-400')}
          >
            {view.lcd}
          </text>
          {[-14, 0, 14].map((dx) => (
            <rect key={dx} x={x + dx - 4} y={y + hh - 11} width={8} height={5} rx={1} className="fill-navy-300" />
          ))}
        </>
      ) : (
        <g
          transform={`translate(${x - 12 * s} ${y - 12 * s - (device === 'battery' ? 5 : 0)}) scale(${s})`}
          {...ICON_STROKE}
          className={cn('fill-none', view.alert ? 'stroke-red-600' : cut ? 'stroke-navy-300' : tone.icon)}
        >
          {ICONS[device]}
          {device === 'battery' && (
            <rect x={9} y={6 + 13 - (13 * level) / 100} width={6} height={(13 * level) / 100} rx={1} className={cn('stroke-none', levelFill)} />
          )}
        </g>
      )}
      {device === 'battery' && (
        <>
          <rect x={bar.x} y={bar.y} width={bar.w} height={5} rx={2.5} className="fill-green-eco-bg" />
          <rect x={bar.x} y={bar.y} width={(bar.w * level) / 100} height={5} rx={2.5} className={levelFill} />
          <line x1={tickX} y1={bar.y - 3} x2={tickX} y2={bar.y + 8} strokeWidth={1.5} className="stroke-navy-500" />
        </>
      )}
      {device === 'grid' && (
        <line
          x1={x - hw * 0.7}
          y1={y + hh * 0.7}
          x2={x + hw * 0.7}
          y2={y - hh * 0.7}
          strokeWidth={3}
          strokeLinecap="round"
          className={cn('stroke-red-600', !view.down && 'opacity-0')}
        />
      )}
      <Labels
        name={NAMES[device]}
        side={layout.labels[device] ?? 'below'}
        x={x}
        y={y}
        hw={hw}
        hh={hh}
        view={view}
        pillStroke={view.alert ? 'stroke-red-600' : tone.stroke}
      />
    </g>
  );
}

function InverterNode({ layout, view }: { layout: Layout; view: NodeView }) {
  const [x, y] = layout.nodes.inverter!;
  const [hw, hh] = layout.inverter;
  const s = layout.iconScale * 0.85;
  return (
    <g className={cn(view.off && 'opacity-50')}>
      <Halo x={x} y={y} hw={hw} hh={hh} active={view.active} className="fill-navy-500" />
      <rect x={x - hw} y={y - hh} width={2 * hw} height={2 * hh} rx={16} strokeWidth={2.5} className="fill-navy-950 stroke-navy-950" />
      <g transform={`translate(${x - 12 * s} ${y - hh + 7}) scale(${s})`} {...ICON_STROKE} className="fill-none stroke-solar-500">
        {INVERTER_ICON}
      </g>
      <text x={x} y={y + hh - 11} textAnchor="middle" fontSize={10.5} fontWeight={600} letterSpacing="0.12em" className="fill-white">
        {layout.inverterName}
      </text>
    </g>
  );
}

// ── Card pieces ────────────────────────────────────────────────
const KPI_TONE: Record<KpiView['tone'], string> = {
  solar: 'text-solar-700',
  battery: 'text-green-700',
  grid: 'text-navy-500',
  plain: 'text-fg',
  save: 'text-solar-ink',
};

const MIX: Record<MixSegment, { label: string; bar: string; dot: string }> = {
  solar: { label: 'Solar', bar: 'bg-solar-500', dot: 'bg-solar-500' },
  battery: { label: 'Battery', bar: 'bg-green-600', dot: 'bg-green-600' },
  grid: { label: 'Grid', bar: 'bg-navy-500', dot: 'bg-navy-500' },
  short: {
    label: 'Not covered',
    bar: 'bg-[repeating-linear-gradient(135deg,var(--color-red-600)_0_4px,var(--color-red-400)_4px_8px)]',
    dot: 'bg-red-600',
  },
};

const PANEL = 'px-4 py-5 md:px-8 md:pt-7 md:pb-8';
const CHIP = 'cursor-pointer rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors duration-150';

// Range input: the track fills up to the value (--p) in the slider's colour (--c).
const RANGE = [
  'mt-1 h-7.5 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none',
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full',
  '[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--c)_var(--p),var(--color-navy-100)_var(--p))]',
  '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-5.5 [&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-(--c)',
  '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-soft',
  '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-navy-100',
  '[&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-(--c)',
  '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-3',
  '[&::-moz-range-thumb]:border-(--c) [&::-moz-range-thumb]:bg-white',
  'focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2',
  'focus-visible:[&::-webkit-slider-thumb]:outline-ring focus-visible:[&::-moz-range-thumb]:outline-2',
  'focus-visible:[&::-moz-range-thumb]:outline-offset-2 focus-visible:[&::-moz-range-thumb]:outline-ring',
].join(' ');

function Slider({
  id,
  label,
  value,
  min = 0,
  max,
  step,
  format,
  color,
  hints,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  step: number;
  format: (v: number) => string;
  color: string;
  hints: [string, string];
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-fg">
        {label}
        <output htmlFor={id} className="font-mono tabular-nums">
          {format(value)}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${RANGE} ${color}`}
        style={{ '--p': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
      <div className="flex justify-between text-xs text-fg-subtle">
        <span>{hints[0]}</span>
        <span>{hints[1]}</span>
      </div>
    </div>
  );
}

function Switch({
  checked,
  danger,
  label,
  state,
  onClick,
}: {
  checked: boolean;
  danger?: boolean;
  label: string;
  state: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-3 py-1 text-left text-sm font-semibold text-fg"
    >
      <span
        className={cn(
          'relative h-6.5 w-11 flex-none rounded-full transition-colors duration-150',
          checked ? (danger ? 'bg-red-600' : 'bg-green-600') : 'bg-navy-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.75 left-0.75 size-5 rounded-full bg-white shadow-soft transition-transform duration-150',
            checked && 'translate-x-4.5',
          )}
        />
      </span>
      <span>
        {label}
        <span className="block text-xs font-medium text-fg-muted">{state}</span>
      </span>
    </button>
  );
}

// ── Particles ──────────────────────────────────────────────────
const SPEED = 190; // viewBox units per second
const PER_KW = 7; // dots spawned per second, per kW (at base speed)
const MAX_TRIP = 3; // seconds for a dot to cross its whole route
// Big commercial loads size arrays of 50+ kWp; past this the wire would be a
// solid line of dots, so density stops growing (the figures still show the kW).
const DENSITY_CAP_KW = 10;

interface Particle {
  f: Flow;
  d: number;
  j: number;
  a: number;
  dying: boolean;
}

/** Canvas can't read Tailwind classes, so resolve the token colours from hidden swatches. */
function readPalette(root: HTMLElement) {
  const out: Record<string, string> = {};
  root.querySelectorAll<HTMLElement>('[data-swatch]').forEach((el) => {
    out[el.dataset.swatch!] = getComputedStyle(el).color;
  });
  return out as Record<FlowColor | 'track', string>;
}

// ── Simulator ──────────────────────────────────────────────────
export default function PowerFlowSimulator({ system }: { system: SystemId }) {
  const def = SYSTEMS[system];
  const uid = useId();
  const rootRef = useRef<HTMLElement>(null);
  const diagramPanelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);

  const [layoutName, setLayoutName] = useState<LayoutName>('wide');
  // Open mid-morning, with the battery charged as if the day had run from dawn.
  const [snap, setSnap] = useState<Snapshot>(() =>
    startAt(def, { input: def.initial, result: def.dispatch(def.initial), hour: DAY_START, playing: false }, OPENING_HOUR),
  );

  const narrow = layoutName === 'narrow';
  const layout = def.layouts[layoutName];
  const routes = useMemo(() => buildRoutes(layout, def.flows), [layout, def.flows]);
  const view = def.view(snap.input, snap.result, narrow);
  const { input } = snap;

  // What the animation loop reads each frame.
  const live = useRef({ snap, layout, routes });
  useEffect(() => {
    live.current = { snap, layout, routes };
  });

  // Pick the diagram by the width its card has.
  useLayoutEffect(() => {
    const card = diagramPanelRef.current!;
    const check = () => setLayoutName(layoutFor(card.clientWidth));
    check();
    const ro = new ResizeObserver(check);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  // Size the canvas to the stage and map viewBox units onto it.
  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = stage.clientWidth;
      const ch = stage.clientHeight;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.getContext('2d')?.setTransform((dpr * cw) / layout.w, 0, 0, (dpr * ch) / layout.h, 0, 0);
    };
    particles.current = [];
    size();
    const ro = new ResizeObserver(size);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [layout]);

  // Animation loop: advances "Play a day" and draws the flowing dots. It only
  // runs while the card is on screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const palette = readPalette(paletteRef.current!);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const acc: Record<string, number> = {};
    let raf = 0;
    let last = performance.now();

    const speedOf = (route: Route) => Math.max(SPEED, route.total / MAX_TRIP);

    function step(dt: number, power: (f: Flow) => number, routes: Record<string, Route>) {
      for (const f of def.flows) {
        const p = power(f);
        if (p > 0.05) {
          // Long routes run faster (same density) so no trip takes more than ~3 s.
          const speed = speedOf(routes[f.id]);
          acc[f.id] = (acc[f.id] ?? Math.random()) + Math.min(p, DENSITY_CAP_KW) * PER_KW * (speed / SPEED) * dt;
          while (acc[f.id] >= 1) {
            acc[f.id] -= 1;
            particles.current.push({ f, d: Math.random() * 6, j: f.lane + (Math.random() * 2 - 1) * 1.2, a: 1, dying: false });
          }
        } else {
          acc[f.id] = Math.random();
        }
      }
      for (const p of particles.current) {
        const route = routes[p.f.id];
        p.d += speedOf(route) * dt;
        // A stopped flow's dots fade at once instead of finishing the trip.
        if (power(p.f) <= 0.05) p.dying = true;
        if (p.dying) p.a -= dt * 5;
        if (p.d >= route.total) p.a = 0;
      }
      particles.current = particles.current.filter((p) => p.a > 0);
    }

    function draw(dt: number) {
      const { snap, layout, routes } = live.current;
      const power = (f: Flow) => snap.result[f.key];
      ctx!.save();
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      ctx!.restore();

      // Wires. In a brownout the inverter disconnects from the grid: show it broken.
      ctx!.lineWidth = 3;
      ctx!.lineJoin = 'round';
      ctx!.lineCap = 'round';
      ctx!.strokeStyle = palette.track;
      for (const [wire, pts] of Object.entries(layout.wires)) {
        ctx!.setLineDash(wire === 'grid' && !snap.input.gridUp ? [6, 8] : []);
        ctx!.beginPath();
        pts!.forEach(([x, y], i) => (i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)));
        ctx!.stroke();
      }
      ctx!.setLineDash([]);

      if (reduced.matches) {
        // Static coloured wires, width by power, arrowhead on the sink wire.
        particles.current = [];
        for (const f of def.flows) {
          const p = power(f);
          if (p <= 0.05) continue;
          const route = routes[f.id];
          ctx!.strokeStyle = palette[f.color];
          ctx!.fillStyle = palette[f.color];
          ctx!.lineWidth = 2 + p * 0.6;
          ctx!.beginPath();
          for (let d = 0; d <= route.total; d += 4) {
            const [x, y] = pointAt(route, d, f.lane);
            if (d === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
          const d = route.total - route.sinkLen * 0.65;
          const [x1, y1] = pointAt(route, d, f.lane);
          const [x0, y0] = pointAt(route, d - 1, f.lane);
          const ang = Math.atan2(y1 - y0, x1 - x0);
          const size = 9 + p * 0.6;
          ctx!.beginPath();
          ctx!.moveTo(x1 + Math.cos(ang) * size, y1 + Math.sin(ang) * size);
          ctx!.lineTo(x1 + Math.cos(ang + 2.5) * size, y1 + Math.sin(ang + 2.5) * size);
          ctx!.lineTo(x1 + Math.cos(ang - 2.5) * size, y1 + Math.sin(ang - 2.5) * size);
          ctx!.fill();
        }
        return;
      }

      step(dt, power, routes);
      for (const p of particles.current) {
        const [x, y] = pointAt(routes[p.f.id], p.d, p.j);
        ctx!.globalAlpha = Math.max(0, p.a);
        ctx!.fillStyle = palette[p.f.color];
        ctx!.beginPath();
        ctx!.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (live.current.snap.playing) setSnap((prev) => (prev.playing ? tickDay(def, prev, dt) : prev));
      draw(dt);
      raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    // Watch the whole card, not the canvas: on a phone the controls and the
    // diagram can't share the screen, and the day must keep playing either way.
    io.observe(rootRef.current!);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [def]);

  // ── Controls ── The setup, load and switches all apply live, even mid-play.
  const update = (fn: (prev: Snapshot) => Snapshot) => setSnap((prev) => settle(def, fn(prev)));
  const setLoad = (loadKw: number) => update((p) => ({ ...p, input: withLoad(p.input, loadKw) }));
  const setBattery = (kWh: number) => update((p) => ({ ...p, input: { ...p.input, battKWh: kWh } }));
  const array = arrayForLoad(input.load);

  const titleId = `${uid}-title`;
  const tiles = (Object.keys(layout.nodes) as (Tile | 'inverter')[]).filter((d): d is Tile => d !== 'inverter');

  // One card, two panels: the diagram and its figures, and beside it (from xl) a
  // fixed-width panel of everything you change, so you can move the slider and
  // watch the flow without scrolling. The diagram takes all the extra width.
  return (
    <section
      ref={rootRef}
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-panel border border-line bg-white shadow-card xl:grid-cols-[minmax(0,1fr)_30rem]"
    >
      <div ref={diagramPanelRef} className={cn(PANEL, 'min-w-0')}>
        {/* Token colours for the canvas (see readPalette). */}
        <div ref={paletteRef} hidden>
          <span data-swatch="solar" className="text-solar-500" />
          <span data-swatch="battery" className="text-green-600" />
          <span data-swatch="grid" className="text-navy-500" />
          <span data-swatch="track" className="text-navy-200" />
        </div>

        <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
          <h3 id={titleId} className="font-display text-xl font-bold text-fg">
            {def.title}
          </h3>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-navy-50 px-3 py-1 font-mono text-sm font-semibold tabular-nums text-fg">
            {input.solar > 0.05 ? (
              <Sun className="size-4 text-solar-700" aria-hidden />
            ) : (
              <Moon className="size-4 text-navy-700" aria-hidden />
            )}
            {clockTime(snap.hour)}
            {!input.gridUp && (
              <span className="rounded-full bg-red-600 px-2 py-px font-sans text-xs font-semibold text-white">Brownout</span>
            )}
          </span>
        </div>

        <dl className="mb-2 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-5">
          {view.kpis.map((k) => (
            <div
              key={k.id}
              className={cn(
                // Labels that wrap push nothing out of line: values sit on a shared baseline.
                'flex min-w-0 flex-col px-3.5 py-3 last:col-span-2 md:last:col-span-1',
                k.tone === 'save' ? 'surface-dark bg-navy-950' : 'bg-white',
              )}
            >
              <dt className="caps flex-1">{k.label}</dt>
              <dd className="mt-0.5">
                <span className={cn('block font-mono text-xl font-semibold whitespace-nowrap tabular-nums', KPI_TONE[k.tone])}>
                  {k.value}
                </span>
                <span className="block truncate text-xs text-fg-muted">{k.sub}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div
          ref={stageRef}
          className={cn('relative mx-auto mt-1 mb-2 w-full', narrow && 'max-w-[420px]')}
          style={{ aspectRatio: `${layout.w} / ${layout.h}` }}
        >
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
          <svg
            viewBox={`0 0 ${layout.w} ${layout.h}`}
            role="img"
            aria-label={view.summary}
            className="absolute inset-0 size-full overflow-visible"
          >
            {tiles.map((d) => (
              <TileNode key={d} device={d} layout={layout} view={view.nodes[d] ?? {}} tick={def.battery?.tick ?? 0} />
            ))}
            <InverterNode layout={layout} view={view.nodes.inverter ?? {}} />
          </svg>
        </div>
      </div>

      <div className={cn(PANEL, '@container border-t border-line xl:border-t-0 xl:border-l')}>
        <div>
          <div className="mb-2 flex justify-between gap-3 text-sm text-fg-muted">
            <span>Your home is powered by</span>
            <strong className="font-mono font-semibold text-fg">{view.mixLabel}</strong>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-navy-100" aria-hidden>
            {view.mix.map((seg) => (
              <span
                key={seg.id}
                className={cn('block h-full transition-[width] duration-250', MIX[seg.id].bar)}
                style={{ width: `${input.load < 0.05 ? 0 : (seg.kw / input.load) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            {view.mix.map((seg) => (
              <li key={seg.id} className="inline-flex items-center gap-1.5">
                <i className={cn('inline-block size-2.5 rounded-full', MIX[seg.id].dot)} />
                {MIX[seg.id].label}
              </li>
            ))}
          </ul>
        </div>

        {/* Silent while playing, or a screen reader would hear every frame. */}
        <p
          aria-live={snap.playing ? 'off' : 'polite'}
          className={cn(
            'mt-4 min-h-[3.2em] rounded-control border-l-4 bg-navy-50 px-4 py-3.5 text-fg',
            view.alert ? 'border-red-600' : 'border-solar-500',
          )}
        >
          {view.story}
        </p>

        <div className="mt-5 grid gap-4.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setSnap((p) => ({ ...p, playing: !p.playing }))}
              className={cn(CHIP, 'inline-flex items-center gap-2 border-solar-500 bg-solar-500 text-navy-950 hover:bg-solar-400')}
            >
              {snap.playing ? <Pause className="size-3.5 fill-current" aria-hidden /> : <Play className="size-3.5 fill-current" aria-hidden />}
              {snap.playing ? 'Pause' : 'Play a day'}
            </button>
            <button
              type="button"
              onClick={() => setSnap((p) => resetDay(def, p))}
              className={cn(CHIP, 'inline-flex items-center gap-2 border-navy-200 bg-white text-fg hover:border-navy-500')}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </button>
            <span className="text-xs text-fg-subtle">
              24 hours in {DAY_SECONDS} seconds · Reset starts the day at {clockTime(RESET_HOUR)}
              {def.battery ? ' with a full battery' : ''}
            </span>
          </div>

          {/* Sized by this panel, not the screen: side by side only when it's roomy. */}
          <div className={cn('grid gap-4.5 @3xl:gap-7', def.battery && '@3xl:grid-cols-2')}>
            <div>
              <Slider
                id={`${uid}-load`}
                label="House load"
                value={input.load}
                min={0.5}
                max={10}
                step={0.1}
                format={kw}
                color="[--c:var(--color-navy-700)]"
                hints={['0.5 kW', '10 kW · aircons on']}
                onChange={setLoad}
              />
              {/* The array follows the load; shown so the harvest figures make sense. */}
              <p className="mt-2.5 flex items-baseline justify-between gap-3 rounded-control bg-solar-50 px-3 py-2 text-sm text-fg-muted">
                <span>Solar panels sized for this load</span>
                <span className="font-mono font-semibold whitespace-nowrap text-solar-700 tabular-nums">
                  {array.kwp.toFixed(1)} kWp
                </span>
              </p>
              <p className="mt-1 text-xs text-fg-subtle">
                {array.panelCount} × 550 W panels · {Math.round(input.load * 24)} kWh a day on 4 sun hours
              </p>
            </div>
            {def.battery && (
              <div role="group" aria-labelledby={`${uid}-batt`}>
                <p id={`${uid}-batt`} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-fg">
                  Battery size
                  <span className="font-mono tabular-nums">{input.battKWh} kWh</span>
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {def.battery.sizes.map((kWh) => {
                    const on = input.battKWh === kWh;
                    return (
                      <button
                        key={kWh}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setBattery(kWh)}
                        className={cn(
                          CHIP,
                          'px-0 py-1.5 whitespace-nowrap',
                          on ? 'border-green-600 bg-green-600 text-white' : 'border-navy-200 bg-white text-fg hover:border-navy-500',
                        )}
                      >
                        {kWh} kWh
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-fg-subtle">Usable capacity</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <Switch
              checked={!input.gridUp}
              danger
              label="Brownout"
              state={input.gridUp ? 'Grid is on' : 'Grid is down'}
              onClick={() => update((p) => ({ ...p, input: { ...p.input, gridUp: !p.input.gridUp } }))}
            />
            <Switch
              checked={input.netMetering}
              label="Net metering"
              state={input.netMetering ? 'Extra solar can be exported' : 'Zero export'}
              onClick={() => update((p) => ({ ...p, input: { ...p.input, netMetering: !p.input.netMetering } }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
