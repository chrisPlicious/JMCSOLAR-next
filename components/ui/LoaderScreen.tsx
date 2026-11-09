'use client';

import { useEffect, useRef, useState } from 'react';
import { JMC_PIXELS } from './loader-pixels';

// ── Palette (sampled from the JMC mark) ───────────────────────────────────────
const NAVY  = '#1c1b51';
const MID   = '#3e67ae';
const ICE   = '#b3e2f8';
const SLATE = '#4a6194';
const SLOT  = '#e8eff8';
const HALO  = '#5aaeee';
const TIER  = [NAVY, MID, ICE] as const;
const GLOW  = ['#4f86e3', '#8fcaf6', '#f2fbff'] as const;

// ── Timeline (seconds since the CSS entrance started) ─────────────────────────
// The entrance — pixel sweep, battery outline, wordmark — is CSS (globals.css)
// so it plays before hydration. Everything after is driven from here.
const SWEEP        = 1.1; // seconds for the reveal to travel once around the logo
const REVEAL_DONE  = 2.2; // last pixel + wordmark (CSS: 1.4s delay + 0.8s) settled: earliest "charged"
const GLOW_START   = 1.9; // twinkles begin
const TWINKLE_LOOP = 5.2; // one pass of the twinkle schedule, repeated while loading
const HOLD         = 1.0; // charged ripple at 100% before the exit
const EXIT         = 0.7; // pixels wipe away and the screen fades

// ── Layout (1920×1080 design space, cropped by VIEW_BOX) ──────────────────────
const VIEW_BOX = '600 90 720 870';
const LOGO = { x: 960, y: 436, s: 0.62 };
const BAT  = { cx: 960, cy: 851, w: 290, h: 76, r: 16, sw: 6, nubW: 14, nubH: 30, pad: 8, cells: 5, gap: 8 };
const BAT_X0 = BAT.cx - (BAT.w + 4 + BAT.nubW) / 2;
const BAT_Y0 = BAT.cy - BAT.h / 2;
const BAT_IX = BAT_X0 + BAT.sw / 2 + BAT.pad;
const BAT_IY = BAT_Y0 + BAT.sw / 2 + BAT.pad;
const BAT_IH = BAT.h - BAT.sw - BAT.pad * 2;
const BAT_IW = BAT.w - BAT.sw - BAT.pad * 2;
const CELL_W = (BAT_IW - BAT.gap * (BAT.cells - 1)) / BAT.cells;
// Rounded-rect perimeter, used as the dash length for the outline draw-in.
const BAT_PERIMETER = 2 * (BAT.w + BAT.h - 4 * BAT.r) + 2 * Math.PI * BAT.r;

// ── Easing ────────────────────────────────────────────────────────────────────
const clamp01   = (v: number) => Math.max(0, Math.min(1, v));
const enter     = (t: number) => 1 - Math.pow(1 - t, 3);
const draw      = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pop       = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const r3        = (n: number) => Math.round(n * 1000) / 1000;

/** Quick rise, slow fall; 0 outside the window. */
function pulse(dt: number, rise: number, fall: number): number {
  if (dt <= 0) return 0;
  if (dt < rise) return enter(dt / rise);
  if (dt < rise + fall) return 1 - draw((dt - rise) / fall);
  return 0;
}

// ── Pixel geometry ────────────────────────────────────────────────────────────
const PIXELS = (() => {
  const g = JMC_PIXELS.map((p) => {
    const pts = p.d.slice(1, -1).split('L').map((s) => s.split(',').map(Number));
    const cx  = pts.reduce((a, q) => a + q[0], 0) / pts.length;
    const cy  = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const ang = (Math.atan2(cx, -cy) / (Math.PI * 2) + 1.01) % 1; // 0 = 12 o'clock, clockwise
    return { ...p, cx, cy, ang, dist: Math.hypot(cx, cy) };
  });
  const lo = Math.min(...g.map((p) => p.dist));
  const hi = Math.max(...g.map((p) => p.dist));
  return g.map((p) => ({
    d:        p.d,
    t:        p.t,
    cx:       p.cx,
    cy:       p.cy,
    rad:      (p.dist - lo) / (hi - lo),
    revealAt: r3(0.2 + p.ang * SWEEP + p.t * 0.08), // clockwise sweep (inline CSS delay)
    exitAt:   p.ang * 0.35 + p.t * 0.05,          // wipe away in the same order
  }));
})();

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Twinkle schedule: [phase 0–1, amplitude] per pixel, stratified in time so
// something is always lit and no pixel fires twice in quick succession.
const TWINKLES = (() => {
  const rnd = mulberry32(20261001);
  const ev: [number, number][][] = PIXELS.map(() => []);
  const N = 44;
  let last = -1;
  for (let k = 0; k < N; k++) {
    const u = (k + rnd() * 0.9) / N;
    let i = 0, tries = 0;
    do { i = Math.floor(rnd() * PIXELS.length); tries++; }
    while (tries < 60 && (i === last || ev[i].some((e) => Math.abs(e[0] - u) < 0.22)));
    ev[i].push([u, 0.6 + rnd() * 0.4]);
    last = i;
  }
  return ev;
})();

function glowAt(i: number, T: number, chargedAt: number | null): number {
  const px = PIXELS[i];
  let g = pulse(T - px.revealAt, 0.06, 0.7);
  if (T > GLOW_START) {
    const cycle = Math.floor((T - GLOW_START) / TWINKLE_LOOP);
    for (let k = Math.max(0, cycle - 1); k <= cycle; k++) {
      for (const [u, amp] of TWINKLES[i]) {
        const at = GLOW_START + k * TWINKLE_LOOP + 0.15 + u * (TWINKLE_LOOP - 0.9);
        if (chargedAt !== null && at > chargedAt) continue;
        g = Math.max(g, amp * pulse(T - at, 0.28, 1.1));
      }
    }
  }
  if (chargedAt !== null) g = Math.max(g, pulse(T - (chargedAt + px.rad * 0.45), 0.14, 0.85));
  return Math.min(g, 1.4);
}

const scaleAbout = (cx: number, cy: number, s: number) =>
  s === 1 ? undefined : `translate(${r3(cx)} ${r3(cy)}) scale(${r3(s)}) translate(${r3(-cx)} ${r3(-cy)})`;

/** Timeline time (ms) at which the CSS entrance started, so JS glow lines up with it. */
function entranceStart(svg: SVGSVGElement | null): number | null {
  const start = svg?.querySelector('.jmc-loader-px')?.getAnimations?.()[0]?.startTime;
  return typeof start === 'number' ? start : null;
}

interface Frame {
  T:         number;        // seconds since the entrance started
  pct:       number;        // smoothed progress, 0–100
  chargedAt: number | null; // T at which progress hit 100
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoaderScreen() {
  const [frame, setFrame] = useState<Frame>({ T: 0, pct: 0, chargedAt: null });
  const [gone,  setGone]  = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let stopped   = false;
    let raf       = 0;
    let origin: number | null = null;
    let target    = 5;
    let current   = 0;
    let chargedAt: number | null = null;

    const advance = (v: number) => {
      target = Math.max(target, v);
    };

    // ── Frame loop: creep progress toward target, then charge → hold → exit ──
    const tick = (now: number) => {
      if (stopped) return;
      origin ??= entranceStart(svgRef.current) ?? now;
      const T = (now - origin) / 1000;

      if (current < target) {
        // Speed scales with gap — faster when far behind, slows near target
        current = Math.min(current + Math.max(0.3, (target - current) * 0.04), target);
      }
      // target only reaches 100 on window load, so this means the page is ready
      if (chargedAt === null && current >= 99.5) chargedAt = Math.max(T, REVEAL_DONE);

      if (chargedAt !== null && T >= chargedAt + HOLD + EXIT) {
        stopped = true;
        setGone(true);
        window.dispatchEvent(new Event('jmc:loader-done'));
        return;
      }
      setFrame({ T, pct: current, chargedAt });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // ── Real signal 1: document readyState ──────────────────────────────────
    const applyReadyState = () => {
      if (document.readyState === 'interactive') advance(50);
      if (document.readyState === 'complete')    advance(88);
    };
    applyReadyState();
    document.addEventListener('readystatechange', applyReadyState);

    // ── Real signal 2: PerformanceObserver — each resource nudges forward ───
    // Range 50-85% is filled by counting network resources as they arrive
    const seenResources = new Set<string>();

    const onResourceEntries = (entries: PerformanceEntry[]) => {
      entries.forEach(e => seenResources.add(e.name));
      // Each resource is worth ~2%, capped at 85%
      advance(Math.min(50 + seenResources.size * 2, 85));
    };

    let observer: PerformanceObserver | null = null;
    try {
      // Seed with already-finished resources (buffered)
      performance.getEntriesByType('resource').forEach(e => seenResources.add(e.name));
      observer = new PerformanceObserver(list => onResourceEntries(list.getEntries()));
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      // PerformanceObserver not supported — no-op
    }

    // ── Real signal 3: window load — page is fully ready ────────────────────
    const onLoad = () => advance(100);

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener('readystatechange', applyReadyState);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  if (gone) return null;

  const { T, pct, chargedAt } = frame;
  const exitAt  = chargedAt === null ? Infinity : chargedAt + HOLD;
  const charged = chargedAt === null ? 0 : T - chargedAt;

  // ── Logo pixels ───────────────────────────────────────────────────────────
  const halos: React.ReactNode[] = [];
  const tiles = PIXELS.map((px, i) => {
    const e      = clamp01((T - (exitAt + px.exitAt)) / 0.22);
    const g      = glowAt(i, T, chargedAt);
    const lift   = 1 + 0.05 * Math.min(g, 1);
    const shrink = 1 - 0.7 * draw(e);

    if (g > 0.01) {
      // The tile's own entrance is CSS; the halo mirrors it so they stay in step.
      const shown = enter(clamp01((T - px.revealAt) / 0.2));
      const grown = 0.2 + 0.8 * pop(clamp01((T - px.revealAt) / 0.45));
      halos.push(
        <path
          key={i}
          d={px.d}
          fill={HALO}
          opacity={r3(Math.min(1, g * 0.8) * shown * (1 - e))}
          transform={scaleAbout(px.cx, px.cy, grown * shrink * lift)}
        />,
      );
    }

    return (
      <g key={i} className="jmc-loader-px" style={{ animationDelay: `${px.revealAt}s` }}>
        <g opacity={e > 0 ? r3(1 - e) : undefined} transform={scaleAbout(px.cx, px.cy, shrink * lift)}>
          <path d={px.d} fill={TIER[px.t]} />
          {g > 0.01 && <path d={px.d} fill={GLOW[px.t]} opacity={r3(Math.min(1, g * 0.9))} />}
        </g>
      </g>
    );
  });

  const bump     = chargedAt === null ? 0 : pulse(charged, 0.2, 0.7);
  const logoTf   = `translate(${LOGO.x} ${LOGO.y}) scale(${r3(LOGO.s * (1 + 0.025 * bump))})`;
  const fadeOut  = enter(clamp01((T - exitAt) / 0.45));

  // ── Battery ───────────────────────────────────────────────────────────────
  const P     = pct / 100;
  const full  = chargedAt === null ? 0 : pulse(charged, 0.12, 0.9);
  const slots = enter(clamp01((T - 0.9) / 0.4));
  const cells = Array.from({ length: BAT.cells }, (_, k) => {
    const f = clamp01(P * BAT.cells - k);
    const x = BAT_IX + k * (CELL_W + BAT.gap);
    const w = CELL_W * f;
    return (
      <g key={k}>
        {w > 0.5 && <rect x={x} y={BAT_IY} width={r3(w)} height={BAT_IH} rx={5} fill={MID} />}
        {f > 0 && f < 1 && w > 6 && <rect x={r3(x + w - 5)} y={BAT_IY} width={5} height={BAT_IH} rx={2.5} fill={ICE} />}
        {full > 0 && <rect x={x} y={BAT_IY} width={CELL_W} height={BAT_IH} rx={5} fill={ICE} opacity={r3(full * 0.85)} />}
      </g>
    );
  });

  const overlay = 1 - draw(clamp01((T - exitAt - 0.3) / 0.4));
  const shownPct = Math.floor(pct);

  return (
    <div
      role="progressbar"
      aria-label="Loading JMC Solar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shownPct}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      style={{ opacity: overlay }}
    >
      <svg
        ref={svgRef}
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="h-auto w-[min(420px,78vw)] max-h-[88svh] overflow-visible"
      >
        <defs>
          <filter id="jmc-loader-halo" filterUnits="userSpaceOnUse" x={-600} y={-600} width={1200} height={1200}>
            <feGaussianBlur stdDeviation={18} />
          </filter>
        </defs>

        {/* ── Logo ── */}
        <g transform={logoTf}>
          <g filter="url(#jmc-loader-halo)">{halos}</g>
          <g>{tiles}</g>
          <g opacity={fadeOut > 0 ? r3(1 - fadeOut) : undefined}>
            <text className="jmc-loader-wordmark font-wordmark" x={15} y={19} fontSize={52} textAnchor="middle">
              <tspan fontWeight={800} fill={NAVY}>JMC</tspan>
              <tspan fontWeight={500} fill={SLATE}>SOLAR</tspan>
            </text>
          </g>
        </g>

        {/* ── Battery ── */}
        <g
          opacity={fadeOut > 0 ? r3(1 - fadeOut) : undefined}
          transform={fadeOut > 0 ? `translate(0 ${r3(10 * fadeOut)})` : undefined}
        >
          <rect
            className="jmc-loader-outline"
            x={BAT_X0}
            y={BAT_Y0}
            width={BAT.w}
            height={BAT.h}
            rx={BAT.r}
            fill="none"
            stroke={NAVY}
            strokeWidth={BAT.sw}
            strokeDasharray={`${r3(BAT_PERIMETER)} ${r3(BAT_PERIMETER)}`}
            style={{ '--jmc-dash': r3(BAT_PERIMETER) } as React.CSSProperties}
          />
          <rect
            className="jmc-loader-nub"
            x={BAT_X0 + BAT.w + 4}
            y={BAT.cy - BAT.nubH / 2}
            width={BAT.nubW}
            height={BAT.nubH}
            rx={4}
            fill={NAVY}
          />
          <g className="jmc-loader-slots">
            {Array.from({ length: BAT.cells }, (_, k) => (
              <rect key={k} x={BAT_IX + k * (CELL_W + BAT.gap)} y={BAT_IY} width={CELL_W} height={BAT_IH} rx={5} fill={SLOT} />
            ))}
          </g>
          <g opacity={slots < 1 ? r3(slots) : undefined}>{cells}</g>
          <text
            className="jmc-loader-label font-wordmark tabular-nums"
            x={BAT.cx}
            y={BAT_Y0 + BAT.h + 50}
            textAnchor="middle"
            fontSize={26}
            fontWeight={500}
            letterSpacing="0.08em"
            fill={SLATE}
          >
            {shownPct}%
          </text>
        </g>
      </svg>
    </div>
  );
}
