'use client';

import { useEffect, useMemo, useState } from 'react';

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
  appearDelay:  number; // seconds
  waveDelay:    number; // seconds (negative = pre-started in cycle)
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

  // Tiles are computed once on mount; useMemo stabilises random colours
  const tiles = useMemo(buildOuterTiles, []);

  useEffect(() => {
    // Animated percentage counter
    let val = 0;
    const ticker = setInterval(() => {
      val += Math.random() * 4 + 1;
      if (val >= 100) { val = 100; clearInterval(ticker); }
      setPct(Math.floor(val));
    }, 100);

    // Fade out then unmount
    const t1 = setTimeout(() => setFading(true),  4000);
    const t2 = setTimeout(() => setGone(true),    4800);

    return () => { clearInterval(ticker); clearTimeout(t1); clearTimeout(t2); };
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
      <div className="relative w-[320px] h-[320px] mb-10">

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
            <span
              className="font-montserrat font-extrabold text-[22px] tracking-[3px] text-white"
            >
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
          <div className="loader-v2-progress-fill h-full rounded-full" />
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