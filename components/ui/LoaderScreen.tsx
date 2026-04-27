'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// ── Tile configuration ────────────────────────────────────────────────────────
const SVG_CX       = 200;
const SVG_CY       = 200;
const OUTER_COUNT  = 12;
const OUTER_RADIUS = 148;
const TILE_SIZE    = 18;
const TILE_GAP     = 3;
const WAVE_PERIOD  = 2.8; // seconds for one full sweep

const COLOR_BANDS = {
  dark:  ['#152848', '#1a2e52', '#1e3560'],
  mid:   ['#3260a0', '#3d6a9e', '#4878b0'],
  light: ['#6b9fd4', '#7fb5dc', '#5a90c4'],
  pale:  ['#a3cbe8', '#b5d8ef', '#90c0df'],
} as const;

type Band = keyof typeof COLOR_BANDS;

// Each cluster is a 3-column × 2-row grid of tiles
const CLUSTER_BANDS: Band[][] = [
  ['dark', 'mid',  'dark' ],
  ['mid',  'pale', 'light'],
];

function pick(band: Band, index: number): string {
  const arr = COLOR_BANDS[band];
  return arr[index % arr.length];
}

interface TileData {
  transform:    string;
  fill:         string;
  appearDelay:  number;
  waveDelay:    number;
}

const r = (n: number) => Math.round(n * 1e4) / 1e4;

function buildOuterTiles(): TileData[] {
  const tiles: TileData[] = [];
  for (let i = 0; i < OUTER_COUNT; i++) {
    const angle = (i / OUTER_COUNT) * Math.PI * 2 - Math.PI / 2;
    const gx    = SVG_CX + Math.cos(angle) * OUTER_RADIUS;
    const gy    = SVG_CY + Math.sin(angle) * OUTER_RADIUS;
    const rot   = (angle * 180 / Math.PI) + 90;
    const norm  = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const lx = (col - 1) * (TILE_SIZE + TILE_GAP);
        const ly = (row - 0.5) * (TILE_SIZE + TILE_GAP);
        tiles.push({
          transform:   `translate(${r(gx)},${r(gy)}) rotate(${r(rot)}) translate(${r(lx)},${r(ly)})`,
          fill:        pick(CLUSTER_BANDS[row][col], tiles.length),
          appearDelay: (80 + tiles.length * 18) / 1000,
          waveDelay:   -((norm / (Math.PI * 2)) * WAVE_PERIOD),
        });
      }
    }
  }
  return tiles;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoaderScreen() {
  const [pct,    setPct]    = useState(0);
  const [fading, setFading] = useState(false);
  const [gone,   setGone]   = useState(false);

  const tiles = useMemo(buildOuterTiles, []);

  // Refs so closures always see latest values without re-running the effect
  const targetRef    = useRef(5);
  const currentRef   = useRef(0);
  const dismissedRef = useRef(false);
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    // ── Smooth rAF loop: creep currentRef toward targetRef ──────────────────
    const animate = () => {
      if (dismissedRef.current) return;
      const cur = currentRef.current;
      const tgt = targetRef.current;
      if (cur < tgt) {
        // Speed scales with gap — faster when far behind, slows near target
        const step = Math.max(0.3, (tgt - cur) * 0.04);
        currentRef.current = Math.min(cur + step, tgt);
        setPct(Math.floor(currentRef.current));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    const advance = (v: number) => {
      targetRef.current = Math.max(targetRef.current, v);
    };

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
    const onLoad = () => {
      advance(100);
      // Wait until the rAF loop visually reaches 100, then dismiss
      const waitForFull = () => {
        if (currentRef.current >= 99.5) {
          setTimeout(() => {
            dismissedRef.current = true;
            cancelAnimationFrame(rafRef.current);
            setFading(true);
            setTimeout(() => {
              setGone(true);
              window.dispatchEvent(new Event('jmc:loader-done'));
            }, 700);
          }, 1000);
        } else {
          requestAnimationFrame(waitForFull);
        }
      };
      requestAnimationFrame(waitForFull);
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }

    return () => {
      dismissedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      observer?.disconnect();
      document.removeEventListener('readystatechange', applyReadyState);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0f2035 0%, #0a1525 70%)',
        transform:  fading ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Tile ring + brand ── */}
      <div className="relative w-[min(320px,85vw)] h-[min(320px,85vw)] mb-10">

        {/* Ambient pulse rings (decorative) */}
        <div
          className="loader-v2-ring-1 absolute rounded-full pointer-events-none"
          style={{ width: 380, height: 380, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        />
        <div
          className="loader-v2-ring-2 absolute rounded-full pointer-events-none"
          style={{ width: 440, height: 440, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        />

        {/* Outer tile ring (SVG) */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 2px rgba(126,200,240,0.08))' }}
        >
          {tiles.map((t, i) => (
            <rect
              key={i}
              x={-TILE_SIZE / 2}
              y={-TILE_SIZE / 2}
              width={TILE_SIZE}
              height={TILE_SIZE}
              rx={1.5}
              fill={t.fill}
              transform={t.transform}
              style={{
                opacity: 0,
                animation: [
                  `loaderTileAppear 0.4s ${t.appearDelay}s ease-out forwards`,
                  `loaderTileWave   3s   ${t.waveDelay}s  ease-in-out infinite`,
                ].join(', '),
              }}
            />
          ))}
        </svg>

        {/* Brand text — centred over the SVG */}
        <div className="loader-v2-brand absolute inset-0 flex items-center justify-center">
          <div className="flex items-baseline gap-1.5">
            <span className="font-montserrat font-extrabold text-[22px] tracking-[3px] text-white">
              JMC
            </span>
            <span
              className="font-montserrat font-normal text-[22px] tracking-[2px]"
              style={{ color: '#6b9fd4' }}
            >
              SOLAR
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress row ── */}
      <div className="loader-v2-progress-row flex items-center gap-3.5">
        <div
          className="w-[160px] h-[2px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #3d6a9e, #7ec8f0)',
              transition: 'width 0.15s ease-out',
            }}
          />
        </div>
        <span
          className="font-montserrat text-[11px] font-medium tracking-[1px] tabular-nums min-w-[32px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
