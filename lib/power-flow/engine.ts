/**
 * Power-flow simulator core, shared by every system type (see ./systems.ts).
 * Pure: no DOM, so the dispatch rules and day profile are unit-tested.
 * Ported from the redesign/*-simulator.html prototypes.
 */
import { sizeArray } from '@/lib/solar-calculator';

export type Device = 'solar' | 'battery' | 'grid' | 'meter' | 'home' | 'inverter';
/** Devices wired straight to the inverter; every flow runs along two of these. */
export type Wire = 'solar' | 'battery' | 'grid' | 'home';
export type Point = [number, number];
export type LabelSide = 'above' | 'below' | 'left';

export interface SimInput {
  pvKwp: number; // installed PV size, derived from the load (see withLoad)
  solar: number; // kW harvested right now: derived from pvKwp and the clock
  load: number; // kW the home draws, set by the visitor
  soc: number; // battery %, simulated; ignored by systems without one
  battKWh: number; // usable battery size, picked by the visitor
  gridUp: boolean;
  netMetering: boolean;
}

/** Where each kW goes this instant. Systems without a battery leave charge/discharge at 0. */
export interface FlowResult {
  direct: number; // solar → home
  charge: number; // solar → battery
  exp: number; // solar → grid (net-metering export)
  curtailed: number; // solar the inverter holds back
  discharge: number; // battery → home
  imp: number; // grid → home
  unserved: number; // load nothing can cover
  floor: number; // battery % the inverter won't draw below right now
  tripped: boolean; // grid-tie inverter off for anti-islanding
}

export type FlowKey = 'direct' | 'charge' | 'exp' | 'discharge' | 'imp';
export type FlowColor = 'solar' | 'battery' | 'grid';

/** One animated stream: source wire → inverter → sink wire, coloured by its source. */
export interface Flow {
  id: string;
  from: Wire;
  to: Wire;
  key: FlowKey;
  color: FlowColor;
  lane: number; // sideways offset, so streams sharing a wire run side by side
}

/** Diagram arrangements, picked by the width the diagram gets. */
export type LayoutName = 'wide' | 'compact' | 'narrow';

/** A diagram arrangement in viewBox units. */
export interface Layout {
  w: number;
  h: number;
  tile: number; // half-size of a device tile
  iconScale: number;
  inverter: Point; // half width / height
  meter: Point;
  nodes: Partial<Record<Device, Point>>;
  labels: Partial<Record<Device, LabelSide>>;
  wires: Partial<Record<Wire, Point[]>>;
  inverterName: string;
}

export interface Snapshot {
  input: SimInput;
  result: FlowResult;
  hour: number; // simulated clock; drives the solar harvest
  playing: boolean;
}

// ── Formatting ─────────────────────────────────────────────────
export const kw = (x: number) => `${x.toFixed(1)} kW`;
export const peso = (x: number) => `₱${Math.abs(x).toFixed(2)}`;
export const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
export function hours(h: number) {
  if (!isFinite(h)) return '–';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  return `${h.toFixed(1)} h`;
}
/** Snap flows too small to show (they'd read "0.0 kW") to zero, so they neither animate nor get described. */
export const zero = (x: number) => (x < 0.05 ? 0 : x);

// ── The day ────────────────────────────────────────────────────
export const DAY_SECONDS = 40; // "Play a day" runs 24 h in this many seconds
export const DAY_START = 5; // the day begins at dawn…
export const DAWN_SOC = 30; // …with the battery at this charge
export const OPENING_HOUR = 10; // the moment the card first shows
export const RESET_HOUR = 12; // "Reset" restarts the day at noon…
export const RESET_SOC = 100; // …with a full battery

// Share of nameplate kWp a PH rooftop array delivers at solar noon, after
// heat, dust, wiring and inverter losses.
export const PERFORMANCE_RATIO = 0.8;

/** Sun strength 0–1: up at 6:00, peak at noon, down at 18:00. */
export const sunAt = (h: number) => (h <= 6 || h >= 18 ? 0 : Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 1.3));

/** kW an array of `kwp` harvests at hour `h`. */
export const harvestAt = (kwp: number, h: number) => Math.round(kwp * PERFORMANCE_RATIO * sunAt(h) * 100) / 100;

/**
 * The array the visitor's house load calls for, sized exactly as the savings
 * calculator sizes it, with the load taken as the home's all-day average.
 */
export const arrayForLoad = (loadKw: number) => sizeArray(loadKw * 24);

/** New house load, with the solar array resized to match. */
export const withLoad = (input: SimInput, loadKw: number): SimInput => ({
  ...input,
  load: loadKw,
  pvKwp: arrayForLoad(loadKw).kwp,
});

export function clockTime(h: number) {
  const hh = String(Math.floor(h)).padStart(2, '0');
  const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ── Routes ─────────────────────────────────────────────────────
export interface Route {
  pts: Point[];
  cum: number[];
  total: number;
  sinkLen: number;
}

function makeRoute(pts: Point[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, cum, total: cum[cum.length - 1] };
}

/**
 * A flow's route is wire(source) + reversed wire(sink). The stretch inside the
 * inverter and meter boxes is hidden because those boxes sit above the canvas.
 */
export function buildRoutes(layout: Layout, flows: Flow[]) {
  const routes: Record<string, Route> = {};
  for (const f of flows) {
    const sink = makeRoute([...(layout.wires[f.to] ?? [])].reverse());
    const route = makeRoute([...(layout.wires[f.from] ?? []), ...sink.pts]);
    routes[f.id] = { ...route, sinkLen: sink.total };
  }
  return routes;
}

/** Position `d` units along a route, offset `j` units to the left of travel. */
export function pointAt(route: Route, d: number, j: number): Point {
  const { pts, cum } = route;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  return [x0 + dx * t - (dy / len) * j, y0 + dy * t + (dx / len) * j];
}

// ── State transitions ──────────────────────────────────────────
interface Dispatcher {
  battery?: unknown; // present when the system has a battery
  brownout: [number, number]; // scheduled outage during "Play a day"
  dispatch(s: SimInput, dtH?: number): FlowResult;
}

/** Recompute the harvest and flows after a change to the setup, load or switches. */
export function settle(def: Dispatcher, snap: Snapshot): Snapshot {
  const input = { ...snap.input, solar: harvestAt(snap.input.pvKwp, snap.hour) };
  return { ...snap, input, result: def.dispatch(input) };
}

/**
 * Move the clock forward `dtH` hours: the harvest follows the sun and the
 * battery charges or drains. `dtH` also goes to dispatch so the battery can't
 * overshoot its limits within one step.
 *
 * The scheduled brownout only flips the grid as the clock enters or leaves its
 * window, so the visitor's own brownout switch still works mid-day.
 */
export function advance(def: Dispatcher, snap: Snapshot, dtH: number): Snapshot {
  const inWindow = (h: number) => h >= def.brownout[0] && h < def.brownout[1];
  const hour = (snap.hour + dtH) % 24;
  const input: SimInput = { ...snap.input, solar: harvestAt(snap.input.pvKwp, hour) };
  if (inWindow(snap.hour) !== inWindow(hour)) input.gridUp = !inWindow(hour);
  const result = def.dispatch(input, dtH);
  if (def.battery && input.battKWh > 0) {
    const delta = ((result.charge - result.discharge) * dtH * 100) / input.battKWh;
    input.soc = Math.min(100, Math.max(0, input.soc + delta));
  }
  return { ...snap, input, result, hour };
}

/** One animation frame of "Play a day": `dt` real seconds. */
export const tickDay = (def: Dispatcher, snap: Snapshot, dt: number) => advance(def, snap, (dt * 24) / DAY_SECONDS);

/** "Reset": 6:00, full battery, grid on, paused. The visitor's setup is kept. */
export function resetDay(def: Dispatcher, snap: Snapshot): Snapshot {
  return settle(def, {
    ...snap,
    hour: RESET_HOUR,
    playing: false,
    input: { ...snap.input, soc: RESET_SOC, gridUp: true },
  });
}

/**
 * The state at `hour`, as if the day had run from dawn with the battery at
 * DAWN_SOC. This is how the battery's starting charge follows the time of day.
 */
export function startAt(def: Dispatcher, snap: Snapshot, hour: number): Snapshot {
  const STEP_H = 0.05;
  let s = settle(def, { ...snap, hour: DAY_START, input: { ...snap.input, soc: DAWN_SOC } });
  const hoursSinceDawn = (((hour - DAY_START) % 24) + 24) % 24;
  const steps = Math.round(hoursSinceDawn / STEP_H);
  for (let i = 0; i < steps; i++) s = advance(def, s, STEP_H);
  return settle(def, { ...s, hour });
}
