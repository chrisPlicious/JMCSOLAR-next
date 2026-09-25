import { REGIONS } from '@/lib/solar-calculator';
import {
  hours,
  kw,
  list,
  peso,
  withLoad,
  zero,
  type Device,
  type Flow,
  type FlowColor,
  type FlowResult,
  type Layout,
  type LayoutName,
  type SimInput,
} from './engine';

/** Service slugs that have a simulator. */
export const SIMULATOR_SYSTEMS = ['hybrid', 'ongrid'] as const;
export type SystemId = (typeof SIMULATOR_SYSTEMS)[number];

export function isSimulatorSystem(slug: string): slug is SystemId {
  return (SIMULATOR_SYSTEMS as readonly string[]).includes(slug);
}

// ── What the card renders ──────────────────────────────────────
export interface NodeView {
  value?: string;
  sub?: string;
  subTone?: 'warn' | 'alert';
  active?: boolean;
  off?: boolean;
  alert?: boolean; // home can't be fully powered
  down?: boolean; // grid in a brownout
  low?: boolean; // battery at its floor
  level?: number; // battery %
  lcd?: string; // net meter readout
}

export interface KpiView {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: FlowColor | 'plain' | 'save';
}

export type MixSegment = FlowColor | 'short';

export interface SimView {
  kpis: KpiView[];
  nodes: Partial<Record<Device, NodeView>>;
  mixLabel: string;
  mix: { id: MixSegment; kw: number }[];
  story: string;
  alert: boolean;
  summary: string; // accessible name for the diagram
}

export interface SystemDef {
  id: SystemId;
  title: string;
  /** Sizes the visitor can pick (usable kWh), the charge/discharge limit and the reserve tick. */
  battery?: { sizes: number[]; kW: number; tick: number };
  initial: SimInput;
  flows: Flow[];
  layouts: Record<LayoutName, Layout>;
  brownout: [number, number];
  dispatch(s: SimInput, dtH?: number): FlowResult;
  view(s: SimInput, r: FlowResult, narrow: boolean): SimView;
}

// Same rates the savings calculator uses: LEYECO V (Ormoc) import, and the
// generation charge credited for net-metering exports.
const RATE = REGIONS['eastern-visayas-ormoc'].rate;
const CREDIT = REGIONS['eastern-visayas-ormoc'].genCharge;

function gridKpi(s: SimInput, r: FlowResult): KpiView {
  return {
    id: 'grid',
    label: 'Grid',
    value: !s.gridUp ? 'Off' : kw(r.imp > 0 ? r.imp : r.exp),
    sub: !s.gridUp ? 'Brownout' : r.imp > 0 ? 'Importing' : r.exp > 0 ? 'Exporting' : 'Idle',
    tone: 'grid',
  };
}

function gridNodes(s: SimInput, r: FlowResult): Partial<Record<Device, NodeView>> {
  const trading = s.gridUp && (r.imp > 0 || r.exp > 0);
  return {
    grid: {
      value: !s.gridUp ? 'Off' : r.imp > 0 ? kw(r.imp) : r.exp > 0 ? kw(r.exp) : '0.0 kW',
      sub: !s.gridUp ? 'Brownout' : r.imp > 0 ? 'Importing' : r.exp > 0 ? 'Exporting' : 'Idle',
      subTone: !s.gridUp ? 'alert' : undefined,
      down: !s.gridUp,
      active: trading,
    },
    // Net meter: + is energy bought from the grid, − is energy sold back.
    meter: {
      lcd: !s.gridUp ? '- - -' : r.imp > 0 ? `+${r.imp.toFixed(1)}` : r.exp > 0 ? `−${r.exp.toFixed(1)}` : '0.0',
      sub: !s.gridUp
        ? 'No grid'
        : r.imp > 0
          ? `Billing ${peso(r.imp * RATE)}/hr`
          : r.exp > 0
            ? `Credit ${peso(r.exp * CREDIT)}/hr`
            : 'Idle',
      down: !s.gridUp,
      active: trading,
    },
  };
}

function solarKpi(s: SimInput, r: FlowResult, extraSub?: string): KpiView {
  return {
    id: 'solar',
    label: 'Solar harvest',
    value: kw(s.solar),
    sub:
      extraSub ??
      (r.curtailed > 0 ? `${kw(r.curtailed)} unused` : s.solar < 0.05 ? 'No sun' : `From a ${s.pvKwp.toFixed(1)} kWp array`),
    tone: 'solar',
  };
}

function savingKpi(s: SimInput, r: FlowResult, gridDownSub: string): KpiView {
  if (!s.gridUp) return { id: 'save', label: 'Saving now', value: '—', sub: gridDownSub, tone: 'save' };
  const bill = r.imp * RATE - r.exp * CREDIT;
  return {
    id: 'save',
    label: 'Saving now',
    value: `${peso(s.load * RATE - bill)}/hr`,
    sub: bill < 0 ? `+${peso(bill)}/hr export credit` : bill < 0.005 ? 'Paying nothing to the grid' : `Still paying ${peso(bill)}/hr`,
    tone: 'save',
  };
}

// ── Hybrid ─────────────────────────────────────────────────────
// The 5 kW charge/discharge limit is the inverter's, so it holds for every battery size.
const HYBRID = { kW: 5, reserve: 20, cutoff: 5 };

function hybridDispatch(s: SimInput, dtH?: number): FlowResult {
  const direct = Math.min(s.solar, s.load);
  let surplus = s.solar - direct;
  let deficit = s.load - direct;
  const floor = s.gridUp ? HYBRID.reserve : HYBRID.cutoff;
  let charge = 0, exp = 0, curtailed = 0, discharge = 0, imp = 0, unserved = 0;

  // Priority: solar → home, surplus → battery → grid export (or curtail);
  // deficit → battery (above its floor) → grid (or unserved in a brownout).
  if (surplus > 0) {
    const room = dtH ? (((100 - s.soc) / 100) * s.battKWh) / dtH : Infinity;
    if (s.soc < 99.95) charge = Math.min(surplus, HYBRID.kW, room);
    surplus -= charge;
    if (s.gridUp && s.netMetering) exp = surplus;
    else curtailed = surplus;
  }
  if (deficit > 0) {
    const avail = dtH ? (((s.soc - floor) / 100) * s.battKWh) / dtH : Infinity;
    if (s.soc > floor + 0.05) discharge = Math.max(0, Math.min(deficit, HYBRID.kW, avail));
    deficit -= discharge;
    if (s.gridUp) imp = deficit;
    else unserved = deficit;
  }
  return {
    direct: zero(direct),
    charge: zero(charge),
    exp: zero(exp),
    curtailed: zero(curtailed),
    discharge: zero(discharge),
    imp: zero(imp),
    unserved: zero(unserved),
    floor,
    tripped: false,
  };
}

function hybridBattery(s: SimInput, r: FlowResult) {
  if (r.charge > 0) {
    const h = (((100 - s.soc) / 100) * s.battKWh) / r.charge;
    return { long: `Charging ${kw(r.charge)} · full in ${hours(h)}`, short: `Charging ${kw(r.charge)}` };
  }
  if (r.discharge > 0) {
    const h = (((s.soc - r.floor) / 100) * s.battKWh) / r.discharge;
    return { long: `Using ${kw(r.discharge)} · ${hours(h)} left`, short: `Using ${kw(r.discharge)} · ${hours(h)}` };
  }
  if (s.soc >= 99.95) return { long: 'Full', short: 'Full' };
  if (s.soc <= r.floor + 0.05 && s.load > r.direct) {
    return s.gridUp
      ? { long: `Holding ${HYBRID.reserve}% brownout reserve`, short: `Holding ${HYBRID.reserve}% reserve` }
      : { long: 'Empty (cut-off reached)', short: 'Empty' };
  }
  return { long: 'Standing by', short: 'Standing by' };
}

function hybridStory(s: SimInput, r: FlowResult) {
  const out: string[] = [];
  if (!s.gridUp) out.push('Brownout — the grid is down.');
  if (s.load < 0.05) {
    out.push('Nothing is running in the home.');
  } else if (r.direct >= s.load - 0.05) {
    out.push(`Solar alone covers your whole home (${kw(s.load)}).`);
  } else {
    const src: string[] = [];
    if (r.direct > 0) src.push(`${kw(r.direct)} from solar`);
    if (r.discharge > 0) src.push(`${kw(r.discharge)} from the battery`);
    if (r.imp > 0) src.push(`${kw(r.imp)} from the grid`);
    const only = r.unserved === 0 && src.length === 1;
    if (only && r.discharge > 0) out.push(`The battery powers your whole home (${kw(s.load)}).`);
    else if (only && r.imp > 0) out.push(`The grid powers your whole home (${kw(s.load)}).`);
    else if (src.length) out.push(`Your home needs ${kw(s.load)}: ${list(src)}.`);
    if (r.unserved > 0) {
      out.push(
        r.discharge > 0
          ? `${kw(r.unserved)} can't be covered — the battery is already at its ${HYBRID.kW} kW limit. Switch off heavy loads like aircon until the grid returns.`
          : `The battery has hit its ${HYBRID.cutoff}% cut-off, so ${kw(r.unserved)} can't be covered until the sun comes up or the grid returns.`,
      );
    } else if (!s.gridUp) {
      out.push('Your lights stay on.');
    } else if (r.imp > 0 && r.discharge === 0 && s.soc <= r.floor + 0.05) {
      out.push(
        r.direct > 0
          ? `The battery is holding its ${HYBRID.reserve}% reserve for brownouts, so the grid fills the gap.`
          : `The battery is holding its ${HYBRID.reserve}% reserve for brownouts.`,
      );
    } else if (r.imp > 0 && r.discharge >= HYBRID.kW - 0.05) {
      out.push(`The battery is at its ${HYBRID.kW} kW limit, so the grid adds the rest.`);
    }
  }
  if (r.charge > 0 && r.exp > 0) {
    out.push(`Of the extra solar, ${kw(r.charge)} charges the battery and ${kw(r.exp)} is exported for net-metering credit.`);
  } else if (r.charge > 0) {
    out.push(`The extra ${kw(r.charge)} charges the battery.`);
  } else if (r.exp > 0) {
    out.push(`The battery is full, so the extra ${kw(r.exp)} is exported for net-metering credit.`);
  }
  if (r.curtailed > 0) {
    const why: string[] = [];
    if (!s.gridUp) why.push('the grid is down');
    else if (!s.netMetering) why.push('net metering is off');
    why.push(s.soc >= 99.95 ? 'the battery is full' : `the battery is already charging at ${HYBRID.kW} kW`);
    out.push(`${kw(r.curtailed)} of solar goes unused — ${list(why)}.`);
  }
  return out.join(' ');
}

function hybridView(s: SimInput, r: FlowResult, narrow: boolean): SimView {
  const bs = hybridBattery(s, r);
  const covered = s.load > 0.05 ? ((r.direct + r.discharge) / s.load) * 100 : 100;
  return {
    kpis: [
      solarKpi(s, r),
      {
        id: 'home',
        label: 'Home',
        value: kw(s.load),
        sub: r.unserved > 0 ? `${kw(r.unserved)} not covered` : `${Math.round(covered)}% solar + battery`,
        tone: 'plain',
      },
      { id: 'battery', label: 'Battery', value: `${Math.round(s.soc)}%`, sub: narrow ? bs.short : bs.long, tone: 'battery' },
      gridKpi(s, r),
      savingKpi(s, r, r.unserved > 0 ? 'Grid down · partly covered' : 'Grid down · lights still on'),
    ],
    nodes: {
      solar: {
        value: s.solar >= 0.05 ? `+${kw(s.solar)}` : kw(0),
        sub: r.curtailed > 0 ? `${kw(r.curtailed)} unused` : s.solar < 0.05 ? 'No sun' : '',
        subTone: r.curtailed > 0 ? 'warn' : undefined,
        off: s.solar < 0.05,
        active: s.solar >= 0.05,
      },
      battery: {
        value: `${Math.round(s.soc)}%`,
        sub: narrow ? bs.short : bs.long,
        level: s.soc,
        low: s.soc <= r.floor + 0.05,
        active: r.charge > 0 || r.discharge > 0,
      },
      home: {
        value: kw(s.load),
        sub: r.unserved > 0 ? `${kw(r.unserved)} short` : s.load < 0.05 ? 'Idle' : '',
        subTone: r.unserved > 0 ? 'alert' : undefined,
        alert: r.unserved > 0,
        active: s.load >= 0.05 && r.unserved === 0,
      },
      inverter: { active: s.solar + r.discharge + r.imp > 0.05 },
      ...gridNodes(s, r),
    },
    mixLabel: s.load < 0.05 ? 'Idle' : `${Math.round(covered)}% self-powered`,
    mix: [
      { id: 'solar', kw: r.direct },
      { id: 'battery', kw: r.discharge },
      { id: 'grid', kw: r.imp },
      { id: 'short', kw: r.unserved },
    ],
    story: hybridStory(s, r),
    alert: !s.gridUp,
    summary: `Solar ${kw(s.solar)}, home ${kw(s.load)}, battery ${Math.round(s.soc)}% (${bs.long}), grid ${
      !s.gridUp ? 'down' : r.imp > 0 ? `importing ${kw(r.imp)}` : r.exp > 0 ? `exporting ${kw(r.exp)}` : 'idle'
    }.`,
  };
}

const hybrid: SystemDef = {
  id: 'hybrid',
  title: 'Hybrid Solar Simulator',
  battery: { sizes: [5, 10, 15, 20], kW: HYBRID.kW, tick: HYBRID.reserve },
  initial: withLoad({ pvKwp: 0, solar: 0, load: 0, soc: 0, battKWh: 10, gridUp: true, netMetering: true }, 2),
  // Every solar flow shares one lane so the solar wire stays a clean stream;
  // lanes only separate on the home wire, where all three sources meet.
  flows: [
    { id: 'solar-home', from: 'solar', to: 'home', key: 'direct', color: 'solar', lane: -4 },
    { id: 'solar-batt', from: 'solar', to: 'battery', key: 'charge', color: 'solar', lane: -4 },
    { id: 'solar-grid', from: 'solar', to: 'grid', key: 'exp', color: 'solar', lane: -4 },
    { id: 'batt-home', from: 'battery', to: 'home', key: 'discharge', color: 'battery', lane: 0 },
    { id: 'grid-home', from: 'grid', to: 'home', key: 'imp', color: 'grid', lane: 4 },
  ],
  layouts: {
    wide: {
      w: 960, h: 580, tile: 38, iconScale: 1.55,
      inverter: [70, 40], meter: [52, 32],
      nodes: { solar: [130, 270], battery: [300, 130], grid: [820, 130], meter: [560, 270], inverter: [320, 450], home: [820, 450] },
      labels: { solar: 'above', battery: 'above', grid: 'above', meter: 'below', home: 'below' },
      wires: {
        solar: [[130, 308], [130, 450], [250, 450]],
        battery: [[300, 168], [300, 410]],
        grid: [[820, 168], [820, 270], [345, 270], [345, 410]],
        home: [[782, 450], [390, 450]],
      },
      inverterName: 'HYBRID INVERTER',
    },
    // The wide arrangement pulled in horizontally, for a card beside the controls.
    compact: {
      w: 705, h: 580, tile: 38, iconScale: 1.55,
      inverter: [70, 40], meter: [52, 32],
      nodes: { solar: [95, 270], battery: [235, 130], grid: [610, 130], meter: [440, 270], inverter: [255, 450], home: [610, 450] },
      labels: { solar: 'above', battery: 'above', grid: 'above', meter: 'below', home: 'below' },
      wires: {
        solar: [[95, 308], [95, 450], [185, 450]],
        battery: [[235, 168], [235, 410]],
        grid: [[610, 168], [610, 270], [280, 270], [280, 410]],
        home: [[572, 450], [325, 450]],
      },
      inverterName: 'HYBRID INVERTER',
    },
    narrow: {
      w: 380, h: 712, tile: 32, iconScale: 1.3,
      inverter: [64, 36], meter: [44, 28],
      nodes: { solar: [80, 124], grid: [300, 124], meter: [300, 282], inverter: [110, 420], battery: [80, 592], home: [300, 592] },
      labels: { solar: 'above', grid: 'above', meter: 'left', battery: 'below', home: 'below' },
      wires: {
        solar: [[80, 156], [80, 384]],
        battery: [[80, 560], [80, 456]],
        grid: [[300, 156], [300, 404], [174, 404]],
        home: [[300, 560], [300, 436], [174, 436]],
      },
      inverterName: 'INVERTER',
    },
  },
  brownout: [18, 20],
  dispatch: hybridDispatch,
  view: hybridView,
};

// ── On-grid (grid-tie) ─────────────────────────────────────────
/**
 * Solar → home, surplus → grid export (or curtail without net metering),
 * deficit → grid. In a brownout the inverter must switch off (anti-islanding),
 * so neither solar nor grid reaches the home.
 */
function ongridDispatch(s: SimInput): FlowResult {
  const none = { charge: 0, discharge: 0, floor: 0 };
  if (!s.gridUp) {
    return { ...none, direct: 0, exp: 0, curtailed: zero(s.solar), imp: 0, unserved: zero(s.load), tripped: s.solar >= 0.05 };
  }
  const direct = Math.min(s.solar, s.load);
  const surplus = s.solar - direct;
  return {
    ...none,
    direct: zero(direct),
    exp: zero(s.netMetering ? surplus : 0),
    curtailed: zero(s.netMetering ? 0 : surplus),
    imp: zero(s.load - direct),
    unserved: 0,
    tripped: false,
  };
}

function ongridStory(s: SimInput, r: FlowResult) {
  if (!s.gridUp) {
    return r.tripped
      ? `Brownout — the grid is down, so the grid-tie inverter switches off for safety (anti-islanding). The panels could make ${kw(s.solar)}, but none of it reaches your home, which goes dark. A hybrid system with a battery would keep the lights on.`
      : 'Brownout — the grid is down and there is no sun, so your home has no power until the grid returns.';
  }
  const out: string[] = [];
  if (s.load < 0.05) out.push('Nothing is running in the home.');
  else if (r.direct >= s.load - 0.05) out.push(`Solar alone covers your whole home (${kw(s.load)}).`);
  else if (r.direct > 0) out.push(`Your home needs ${kw(s.load)}: ${kw(r.direct)} from solar and ${kw(r.imp)} from the grid.`);
  else out.push(`${s.solar < 0.05 ? 'No sun right now, so the' : 'The'} grid powers your whole home (${kw(s.load)}).`);
  if (r.exp > 0) out.push(`The extra ${kw(r.exp)} flows out through the net meter for credit.`);
  if (r.curtailed > 0) out.push(`${kw(r.curtailed)} of solar goes unused — without net metering the inverter holds the panels back.`);
  return out.join(' ');
}

function ongridView(s: SimInput, r: FlowResult): SimView {
  const fromSolar = s.load > 0.05 ? (r.direct / s.load) * 100 : 0;
  const used = s.solar >= 0.05 && !r.tripped ? (r.direct / s.solar) * 100 : null;
  return {
    kpis: [
      solarKpi(s, r, r.tripped ? 'Inverter off (brownout)' : undefined),
      {
        id: 'home',
        label: 'Home',
        value: kw(s.load),
        sub: r.unserved > 0 ? 'No power (brownout)' : s.load < 0.05 ? 'Idle' : `${Math.round(fromSolar)}% from solar`,
        tone: 'plain',
      },
      gridKpi(s, r),
      {
        id: 'self',
        label: 'Solar used at home',
        value: used === null ? '—' : `${Math.round(used)}%`,
        sub: r.tripped
          ? 'Inverter off'
          : s.solar < 0.05
            ? 'No sun'
            : r.exp > 0
              ? `${kw(r.exp)} exported`
              : r.curtailed > 0
                ? `${kw(r.curtailed)} unused`
                : 'All used at home',
        tone: 'solar',
      },
      savingKpi(s, r, 'Grid down · no power'),
    ],
    nodes: {
      solar: {
        value: s.solar >= 0.05 ? `+${kw(s.solar)}` : kw(0),
        sub: r.tripped ? 'Inverter off' : r.curtailed > 0 ? `${kw(r.curtailed)} unused` : s.solar < 0.05 ? 'No sun' : '',
        subTone: r.curtailed > 0 ? 'warn' : undefined,
        off: s.solar < 0.05 || r.tripped,
        active: s.solar >= 0.05 && !r.tripped,
      },
      home: {
        value: kw(s.load),
        sub: r.unserved > 0 ? 'No power' : s.load < 0.05 ? 'Idle' : '',
        subTone: r.unserved > 0 ? 'alert' : undefined,
        alert: r.unserved > 0,
        active: s.load >= 0.05 && r.unserved === 0,
      },
      inverter: { off: !s.gridUp, active: s.gridUp && s.solar + r.imp > 0.05 },
      ...gridNodes(s, r),
    },
    mixLabel: s.load < 0.05 ? 'Idle' : r.unserved > 0 ? 'No power' : `${Math.round(fromSolar)}% from solar`,
    mix: [
      { id: 'solar', kw: r.direct },
      { id: 'grid', kw: r.imp },
      { id: 'short', kw: r.unserved },
    ],
    story: ongridStory(s, r),
    alert: !s.gridUp,
    summary: `Solar ${kw(s.solar)}, home ${kw(s.load)}, grid ${
      !s.gridUp ? 'down, inverter off' : r.imp > 0 ? `importing ${kw(r.imp)}` : r.exp > 0 ? `exporting ${kw(r.exp)}` : 'idle'
    }.`,
  };
}

const ongrid: SystemDef = {
  id: 'ongrid',
  title: 'On-Grid Solar Simulator',
  initial: withLoad({ pvKwp: 0, solar: 0, load: 0, soc: 0, battKWh: 0, gridUp: true, netMetering: true }, 2),
  flows: [
    { id: 'solar-home', from: 'solar', to: 'home', key: 'direct', color: 'solar', lane: -4 },
    { id: 'solar-grid', from: 'solar', to: 'grid', key: 'exp', color: 'solar', lane: -4 },
    { id: 'grid-home', from: 'grid', to: 'home', key: 'imp', color: 'grid', lane: 4 },
  ],
  // The hybrid diagram without the battery.
  layouts: {
    wide: {
      w: 960, h: 580, tile: 38, iconScale: 1.55,
      inverter: [78, 40], meter: [52, 32],
      nodes: { solar: [130, 270], grid: [820, 130], meter: [560, 270], home: [820, 450], inverter: [320, 450] },
      labels: { solar: 'above', grid: 'above', meter: 'below', home: 'below' },
      wires: {
        solar: [[130, 308], [130, 450], [242, 450]],
        grid: [[820, 168], [820, 270], [320, 270], [320, 410]],
        home: [[782, 450], [398, 450]],
      },
      inverterName: 'GRID-TIE INVERTER',
    },
    compact: {
      w: 705, h: 580, tile: 38, iconScale: 1.55,
      inverter: [78, 40], meter: [52, 32],
      nodes: { solar: [95, 270], grid: [610, 130], meter: [440, 270], home: [610, 450], inverter: [255, 450] },
      labels: { solar: 'above', grid: 'above', meter: 'below', home: 'below' },
      wires: {
        solar: [[95, 308], [95, 450], [177, 450]],
        grid: [[610, 168], [610, 270], [255, 270], [255, 410]],
        home: [[572, 450], [333, 450]],
      },
      inverterName: 'GRID-TIE INVERTER',
    },
    narrow: {
      w: 380, h: 660, tile: 32, iconScale: 1.3,
      inverter: [64, 36], meter: [44, 28],
      nodes: { solar: [80, 124], grid: [300, 124], meter: [300, 282], home: [300, 540], inverter: [110, 420] },
      labels: { solar: 'above', grid: 'above', meter: 'left', home: 'below' },
      wires: {
        solar: [[80, 156], [80, 384]],
        grid: [[300, 156], [300, 404], [174, 404]],
        home: [[300, 508], [300, 436], [174, 436]],
      },
      inverterName: 'INVERTER',
    },
  },
  brownout: [13, 14.5],
  dispatch: ongridDispatch,
  view: ongridView,
};

export const SYSTEMS: Record<SystemId, SystemDef> = { hybrid, ongrid };
