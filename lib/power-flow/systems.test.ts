import { describe, expect, test } from 'vitest';
import {
  advance,
  buildRoutes,
  DAWN_SOC,
  DAY_START,
  harvestAt,
  loadCap,
  panelsFor,
  pickTime,
  pointAt,
  resetDay,
  RESET_HOUR,
  settle,
  startAt,
  type SimInput,
  type Snapshot,
} from './engine';
import { SYSTEMS, isSimulatorSystem } from './systems';

const { hybrid, ongrid } = SYSTEMS;
const input = (over: Partial<SimInput>): SimInput => ({
  pvKwp: 6,
  solar: 0,
  demand: over.load ?? 0,
  load: 0,
  soc: 50,
  battKWh: 10,
  gridUp: true,
  netMetering: true,
  ...over,
});

describe('solar harvest', () => {
  test('follows the sun and scales with array size', () => {
    expect(harvestAt(6, 3)).toBe(0); // night
    expect(harvestAt(6, 12)).toBeCloseTo(4.8); // noon: 6 kWp × 0.8 performance ratio
    expect(harvestAt(12, 12)).toBeCloseTo(2 * harvestAt(6, 12));
    expect(harvestAt(6, 9)).toBeLessThan(harvestAt(6, 12));
  });

  test('the system size sets the 550 W panel count', () => {
    expect(panelsFor(3)).toBe(6);
    expect(panelsFor(5)).toBe(10);
    expect(panelsFor(5.5)).toBe(10); // an exact fit needs no extra panel
  });

  test('settle derives the harvest from the panel size and the clock', () => {
    const snap: Snapshot = { input: input({ pvKwp: 10, load: 2 }), result: hybrid.dispatch(input({})), hour: 12, playing: false };
    const s = settle(hybrid, snap);
    expect(s.input.solar).toBeCloseTo(8);
    expect(s.result.direct).toBeCloseTo(2);
  });
});

describe('hybrid dispatch', () => {
  test('surplus charges the battery first, then exports', () => {
    const r = hybrid.dispatch(input({ pvKwp: 5, solar: 7.4, load: 2.2, soc: 60 }));
    expect(r.direct).toBeCloseTo(2.2);
    expect(r.charge).toBeCloseTo(5); // the 5 kW inverter's limit
    expect(r.exp).toBeCloseTo(0.2);
    expect(r.curtailed).toBe(0);
  });

  test('without net metering the leftover is curtailed, not exported', () => {
    const r = hybrid.dispatch(input({ pvKwp: 5, solar: 7.4, load: 2.2, soc: 60, netMetering: false }));
    expect(r.exp).toBe(0);
    expect(r.curtailed).toBeCloseTo(0.2);
  });

  test('keeps a 20% brownout reserve while the grid is up', () => {
    const s = input({ load: 1.2, soc: 20 });
    const r = hybrid.dispatch(s);
    expect(r.discharge).toBe(0);
    expect(r.imp).toBeCloseTo(1.2);
    expect(hybrid.view(s, r, false).nodes.battery?.sub).toBe('Holding 20% brownout reserve');
  });

  test('after a brownout drains it below the reserve, the battery says so and waits for solar', () => {
    const s = input({ load: 2, soc: 5 }); // grid back at night, battery at its brownout cut-off
    const r = hybrid.dispatch(s);
    expect(r.discharge).toBe(0);
    expect(r.imp).toBeCloseTo(2);
    const v = hybrid.view(s, r, false);
    expect(v.nodes.battery?.sub).toBe('Below the 20% reserve · refills from extra solar');
    expect(hybrid.view(s, r, true).nodes.battery?.sub).toBe('Below reserve');
    expect(v.story).toContain('below its 20% brownout reserve');
    expect(v.story).not.toContain('holding');
  });

  test('a brownout runs the site on the battery', () => {
    const s = input({ load: 1.8, soc: 70, gridUp: false });
    const r = hybrid.dispatch(s);
    expect(r.discharge).toBeCloseTo(1.8);
    expect(r.unserved).toBe(0);
    expect(hybrid.view(s, r, false).story).toContain('Your lights and equipment stay on.');
  });

  test('solar and battery reach the site at no more than the inverter rating; the grid adds the rest', () => {
    const s = input({ pvKwp: 5, solar: 3, load: 9, soc: 60 });
    const r = hybrid.dispatch(s);
    expect(r.direct).toBeCloseTo(3);
    expect(r.discharge).toBeCloseTo(2);
    expect(r.imp).toBeCloseTo(4);
    expect(hybrid.view(s, r, false).story).toContain('the grid adds the rest');
  });

  test('in a brownout the site goes short only once the battery hits its cut-off', () => {
    const s = input({ load: 3, soc: 5, gridUp: false });
    const r = hybrid.dispatch(s);
    expect(r.discharge).toBe(0);
    expect(r.unserved).toBeCloseTo(3);
    expect(hybrid.view(s, r, false).story).toContain('cut-off');
  });
});

describe('house load and the system size', () => {
  const night = (def: typeof hybrid, over: Partial<SimInput>, hour = 21): Snapshot =>
    settle(def, { input: input(over), result: def.dispatch(input(over)), hour, playing: false });

  test('only a brownout caps the load', () => {
    expect(loadCap({ gridUp: true, pvKwp: 5 })).toBe(Infinity);
    expect(loadCap({ gridUp: false, pvKwp: 5 })).toBe(5);
  });

  test('with the grid up the load can run past the system size: the grid covers the rest', () => {
    const s = night(hybrid, { pvKwp: 5, demand: 8, soc: 70 });
    expect(s.input.load).toBe(8);
    expect(s.result.discharge).toBeCloseTo(5);
    expect(s.result.imp).toBeCloseTo(3);
  });

  test('in a brownout the load is capped at the system size and runs on solar and battery only', () => {
    const s = night(hybrid, { pvKwp: 5, demand: 8, soc: 70, gridUp: false });
    expect(s.input.load).toBe(5);
    expect(s.result.discharge).toBeCloseTo(5);
    expect(s.result.imp).toBe(0);
    expect(s.result.unserved).toBe(0);
    const v = hybrid.view(s.input, s.result, false);
    expect(v.nodes.home?.sub).toBe('3.0 kW switched off');
    expect(v.story).toContain('must stay off until the grid returns');
  });

  test('a bigger system carries more of the load through a brownout', () => {
    expect(night(hybrid, { pvKwp: 3, demand: 8, gridUp: false }).input.load).toBe(3);
    expect(night(hybrid, { pvKwp: 10, demand: 8, gridUp: false }).input.load).toBe(8);
  });

  test('the full load comes back when the grid does', () => {
    const during = night(hybrid, { pvKwp: 5, demand: 8, soc: 70, gridUp: false }, 19.95);
    expect(during.input.load).toBe(5);
    const after = advance(hybrid, during, 0.1);
    expect(after.input.gridUp).toBe(true);
    expect(after.input.load).toBe(8);
  });

  test('on-grid has no brownout: the grid always covers what solar cannot', () => {
    expect(ongrid.brownout).toBeUndefined();
    const s = night(ongrid, { pvKwp: 5, demand: 8 }, 12);
    expect(s.input.load).toBe(8);
    expect(s.result.direct).toBeCloseTo(4); // noon sun on 5 kWp
    expect(s.result.imp).toBeCloseTo(4);
    for (const h of [12.95, 17.95]) expect(advance(ongrid, night(ongrid, {}, h), 0.1).input.gridUp).toBe(true);
  });
});

describe('on-grid dispatch', () => {
  test('exports surplus through the net meter', () => {
    const r = ongrid.dispatch(input({ solar: 6, load: 2.4 }));
    expect(r.direct).toBeCloseTo(2.4);
    expect(r.exp).toBeCloseTo(3.6);
    expect(r.imp).toBe(0);
  });

});

describe('the day', () => {
  const at = (def: typeof hybrid, over: Partial<SimInput>, hour: number): Snapshot =>
    settle(def, { input: input(over), result: def.dispatch(input(over)), hour, playing: true });

  test('reset: noon, full battery, grid back on, paused, setup kept', () => {
    const s = resetDay(hybrid, at(hybrid, { pvKwp: 9, load: 3, battKWh: 15, soc: 22, gridUp: false }, 19.5));
    expect(s.hour).toBe(12);
    expect(s.hour).toBe(RESET_HOUR);
    expect(s.input.soc).toBe(100);
    expect(s.input.gridUp).toBe(true);
    expect(s.playing).toBe(false);
    expect(s.input).toMatchObject({ pvKwp: 9, load: 3, battKWh: 15 });
    expect(s.input.solar).toBeCloseTo(7.2); // noon sun on 9 kWp
    // Battery already full, so everything solar doesn't use at home is exported.
    expect(s.result.charge).toBe(0);
    expect(s.result.exp).toBeCloseTo(4.2);
  });

  test('the battery starts the day at dawn charge', () => {
    const s = startAt(hybrid, at(hybrid, { soc: 90 }, 14), DAY_START);
    expect(s.hour).toBe(DAY_START);
    expect(s.input.soc).toBe(DAWN_SOC);
  });

  test('the starting charge follows the time of day', () => {
    const morning = startAt(hybrid, at(hybrid, { load: 1 }, DAY_START), 7).input.soc;
    const midday = startAt(hybrid, at(hybrid, { load: 1 }, DAY_START), 13).input.soc;
    expect(midday).toBeGreaterThan(morning);
  });

  test('a bigger battery fills more slowly', () => {
    const small = startAt(hybrid, at(hybrid, { load: 1, battKWh: 5 }, DAY_START), 11).input.soc;
    const big = startAt(hybrid, at(hybrid, { load: 1, battKWh: 20 }, DAY_START), 11).input.soc;
    expect(small).toBeGreaterThan(big);
  });

  test('the battery never overshoots full', () => {
    let snap = at(hybrid, { pvKwp: 15, soc: 99.9 }, 11);
    for (let i = 0; i < 100; i++) snap = advance(hybrid, snap, 0.03);
    expect(snap.input.soc).toBeLessThanOrEqual(100);
    expect(snap.input.soc).toBeGreaterThan(99);
  });

  test('the scheduled brownout starts and ends with its window', () => {
    const down = advance(hybrid, at(hybrid, {}, 17.95), 0.1);
    expect(down.input.gridUp).toBe(false);
    expect(advance(hybrid, { ...down, hour: 19.95 }, 0.1).input.gridUp).toBe(true);
  });

  test('the time picker: paused at the picked time, battery charged as the day so far left it', () => {
    const s = pickTime(hybrid, at(hybrid, { load: 1, soc: 100 }, 12), 7);
    expect(s.hour).toBe(7);
    expect(s.playing).toBe(false);
    expect(s.input.soc).toBeCloseTo(startAt(hybrid, at(hybrid, { load: 1 }, 12), 7).input.soc);
    expect(pickTime(hybrid, s, 13).input.soc).toBeGreaterThan(s.input.soc);
  });

  test("the time picker skips the scheduled brownout but keeps the visitor's switch", () => {
    expect(pickTime(hybrid, at(hybrid, { load: 1 }, 12), 19).input.gridUp).toBe(true);
    const down = pickTime(hybrid, at(hybrid, { pvKwp: 5, demand: 8, gridUp: false }, 12), 21);
    expect(down.input.gridUp).toBe(false);
    expect(down.input.load).toBe(5);
  });

  test("inside the window the visitor's own switch still holds", () => {
    // Grid switched back on mid-outage: no window edge, so it stays on.
    expect(advance(hybrid, at(hybrid, { gridUp: true }, 18.5), 0.1).input.gridUp).toBe(true);
    // Brownout switched on outside the window: stays down.
    expect(advance(hybrid, at(hybrid, { gridUp: false }, 10), 0.1).input.gridUp).toBe(false);
  });
});

describe('layouts', () => {
  for (const def of [hybrid, ongrid]) {
    for (const [name, L] of Object.entries(def.layouts)) {
      test(`${def.id} ${name}: every wire runs from its device's tile edge into the inverter`, () => {
        const [ix, iy] = L.nodes.inverter!;
        const [iw, ih] = L.inverter;
        for (const [wire, pts] of Object.entries(L.wires)) {
          const [nx, ny] = L.nodes[wire as keyof typeof L.nodes]!;
          const [sx, sy] = pts![0];
          const onEdge = Math.abs(Math.abs(sx - nx) - L.tile) < 0.5 || Math.abs(Math.abs(sy - ny) - L.tile) < 0.5;
          expect(onEdge, `${wire} starts on its tile edge`).toBe(true);
          const [ex, ey] = pts!.at(-1)!;
          expect(Math.abs(ex - ix) <= iw && Math.abs(ey - iy) <= ih, `${wire} ends at the inverter`).toBe(true);
        }
        // Everything sits inside the viewBox.
        for (const [x, y] of Object.values(L.nodes)) {
          expect(x).toBeGreaterThan(0);
          expect(x).toBeLessThan(L.w);
          expect(y).toBeGreaterThan(0);
          expect(y).toBeLessThan(L.h);
        }
      });
    }
  }
});

describe('routes', () => {
  test('run from the source wire through the inverter to the sink wire', () => {
    const layout = hybrid.layouts.wide;
    const route = buildRoutes(layout, hybrid.flows)['solar-home'];
    expect(route.pts[0]).toEqual(layout.wires.solar![0]);
    expect(route.pts.at(-1)).toEqual(layout.wires.home![0]);
    expect(pointAt(route, route.total, 0)).toEqual(layout.wires.home![0]);
  });
});

test('only hybrid and on-grid have simulators', () => {
  expect(isSimulatorSystem('hybrid')).toBe(true);
  expect(isSimulatorSystem('ongrid')).toBe(true);
  expect(isSimulatorSystem('pump')).toBe(false);
});
