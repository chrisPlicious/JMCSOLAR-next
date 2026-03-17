// ─────────────────────────────────────────────────────────────────
// PLACEHOLDER DATA — Replace with real product inventory when ready
// Each field maps directly to what is displayed on the Products page
// and the Contact form pre-fill. Update this file only; no UI changes
// required when real data arrives.
// ─────────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'panels'
  | 'batteries'
  | 'inverters'
  | 'controllers'
  | 'converters';

export interface Product {
  /** Kebab-case unique identifier — used as the `?product=` URL param */
  id: string;
  /** Full product / model name shown on the card */
  name: string;
  /** Manufacturer / brand name */
  brand: string;
  /** Product category — drives filter tabs and card icon colour */
  category: ProductCategory;
  /** Short spec line shown under the name, e.g. "500W · Mono PERC" */
  specs: string;
  /** 1–2 sentence product summary */
  description: string;
  /** Price label shown on the card — use "Contact for pricing" when unknown */
  priceLabel: string;
  /** Optional highlight badge: "Best Seller" | "Popular" | "New" | etc. */
  badge?: string;
  /** Optional image path (public/products/…). Falls back to gradient + icon. */
  image?: string;
  /**
   * Service ID that best matches this product.
   * Used to pre-select "System Type" in the Contact form.
   * Valid values: hybrid | ongrid | bess | pump | ev | ups | controller
   */
  relatedService: string;
}

// ─────────────────────────────────────────────────────────────────
// Category filter tab definitions
// ─────────────────────────────────────────────────────────────────
export const productCategories: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'All Products'      },
  { id: 'panels',      label: 'Solar Panels'       },
  { id: 'batteries',   label: 'Batteries'          },
  { id: 'inverters',   label: 'Inverters'          },
  { id: 'controllers', label: 'Charge Controllers' },
  { id: 'converters',  label: 'Converters'         },
];

// ─────────────────────────────────────────────────────────────────
// Product catalogue — 15 placeholder entries
// ─────────────────────────────────────────────────────────────────
export const products: Product[] = [

  // ── Solar Panels ──────────────────────────────────────────────
  {
    id: 'trina-550w',
    name: 'Trina Solar 550W Vertex S+',
    brand: 'Trina Solar',
    category: 'panels',
    specs: '550W · Monocrystalline TOPCon · 21.2% Efficiency',
    description:
      'High-output TOPCon module with excellent low-light performance and a 30-year linear power warranty. Ideal for rooftop hybrid and on-grid systems.',
    priceLabel: 'Contact for pricing',
    badge: 'Best Seller',
    relatedService: 'hybrid',
  },
  {
    id: 'longi-500w',
    name: 'LONGi Hi-MO5 500W LR5-66HIH',
    brand: 'LONGi Solar',
    category: 'panels',
    specs: '500W · Monocrystalline PERC · 20.9% Efficiency',
    description:
      'Industry-leading PERC technology from one of the world\'s largest solar manufacturers. High bifacial gain for ground-mount and elevated installations.',
    priceLabel: 'Contact for pricing',
    relatedService: 'hybrid',
  },
  {
    id: 'ja-solar-400w',
    name: 'JA Solar 400W DeepBlue 3.0',
    brand: 'JA Solar',
    category: 'panels',
    specs: '400W · Monocrystalline PERC · 20.4% Efficiency',
    description:
      'Cost-effective entry point without compromising quality. Suits budget-conscious residential builds with limited roof space.',
    priceLabel: 'Contact for pricing',
    relatedService: 'ongrid',
  },
  {
    id: 'canadian-440w',
    name: 'Canadian Solar HiKu6 440W',
    brand: 'Canadian Solar',
    category: 'panels',
    specs: '440W · Mono PERC · 20.6% Efficiency · 144-cell',
    description:
      'Rugged 144-cell module with outstanding PID resistance and salt-mist/ammonia certification — a solid choice for coastal Visayas properties.',
    priceLabel: 'Contact for pricing',
    relatedService: 'hybrid',
  },

  // ── Batteries ─────────────────────────────────────────────────
  {
    id: 'lvtopsun-100ah-48v',
    name: 'LVTOPSUN LFP 100Ah 48V',
    brand: 'LVTOPSUN',
    category: 'batteries',
    specs: '4.8 kWh · LiFePO4 · ≥4000 cycles · Rack-Mount',
    description:
      'Lithium iron phosphate rack battery with built-in BMS, thermal protection, and RS485/CAN communication for hybrid inverter integration.',
    priceLabel: 'Contact for pricing',
    badge: 'Popular',
    relatedService: 'bess',
  },
  {
    id: 'sunri-200ah-48v',
    name: 'Sunri LFP 200Ah 48V',
    brand: 'Sunri',
    category: 'batteries',
    specs: '9.6 kWh · LiFePO4 · ≥4000 cycles · Wall-Mount',
    description:
      'High-capacity wall-mount LFP battery providing up to 12 hours of backup for a typical Filipino home. Compatible with Sofar, Deye, and Solax inverters.',
    priceLabel: 'Contact for pricing',
    badge: 'Best Seller',
    relatedService: 'bess',
  },
  {
    id: 'sofar-bts-5kwh',
    name: 'Sofar BTS E5-DS5.12 5kWh',
    brand: 'Sofar Solar',
    category: 'batteries',
    specs: '5 kWh · LiFePO4 · Plug-and-Play · Stackable',
    description:
      'Stackable battery module designed for seamless integration with Sofar hybrid inverters. Expand capacity by adding modules without replacing existing hardware.',
    priceLabel: 'Contact for pricing',
    relatedService: 'bess',
  },
  {
    id: 'pylontech-us3000c',
    name: 'Pylontech US3000C 3.5kWh',
    brand: 'Pylontech',
    category: 'batteries',
    specs: '3.5 kWh · LiFePO4 · 6000 cycles · Rack-Mount',
    description:
      'Premium Pylontech module with an exceptional 6,000-cycle lifespan. Wide inverter compatibility including Victron, GoodWe, and Solis.',
    priceLabel: 'Contact for pricing',
    relatedService: 'bess',
  },

  // ── Inverters ──────────────────────────────────────────────────
  {
    id: 'sofar-6kw-hybrid',
    name: 'Sofar Solar HYD 6000-EP',
    brand: 'Sofar Solar',
    category: 'inverters',
    specs: '6 kW · Hybrid · Single-Phase · 2× MPPT',
    description:
      'Feature-packed hybrid inverter with dual MPPT, EPS backup output, and native compatibility with LVTOPSUN and Sunri battery banks. Top choice for Philippine residential builds.',
    priceLabel: 'Contact for pricing',
    badge: 'Most Popular',
    relatedService: 'hybrid',
  },
  {
    id: 'solax-x3-8kw',
    name: 'Solax Power X3-Hybrid 8kW',
    brand: 'Solax Power',
    category: 'inverters',
    specs: '8 kW · Hybrid · Three-Phase · 2× MPPT',
    description:
      'Three-phase hybrid inverter suited for SMEs and larger commercial installations. Cloud monitoring via Solax Cloud app.',
    priceLabel: 'Contact for pricing',
    relatedService: 'hybrid',
  },
  {
    id: 'deye-10kw',
    name: 'Deye Sun-10k-SG04LP3',
    brand: 'Deye',
    category: 'inverters',
    specs: '10 kW · Hybrid · Three-Phase · Low-Voltage Battery',
    description:
      'High-power hybrid inverter supporting both low-voltage LFP and high-voltage battery packs. Generator support and parallel operation available.',
    priceLabel: 'Contact for pricing',
    relatedService: 'hybrid',
  },

  // ── Charge Controllers ─────────────────────────────────────────
  {
    id: 'victron-100-30',
    name: 'Victron SmartSolar MPPT 100/30',
    brand: 'Victron Energy',
    category: 'controllers',
    specs: '30A · 100V PV · 12/24V · Bluetooth',
    description:
      'Industry-leading MPPT controller with built-in Bluetooth for real-time monitoring via the VictronConnect app. Supports all battery chemistries including LFP.',
    priceLabel: 'Contact for pricing',
    badge: 'Best Seller',
    relatedService: 'controller',
  },
  {
    id: 'epever-40a',
    name: 'EPSolar Tracer 4215BN 40A',
    brand: 'EPSolar',
    category: 'controllers',
    specs: '40A · 150V PV · 12/24/36/48V Auto · RS485',
    description:
      'Cost-effective MPPT controller with wide PV input voltage range, LCD display, and RS485 for data logging. Suitable for medium off-grid systems.',
    priceLabel: 'Contact for pricing',
    relatedService: 'controller',
  },

  // ── Converters ─────────────────────────────────────────────────
  {
    id: 'victron-orion-24-12',
    name: 'Victron Orion-Tr 24/12-20A',
    brand: 'Victron Energy',
    category: 'converters',
    specs: '20A · 24V→12V · 240W · Isolated DC-DC',
    description:
      'Galvanically isolated DC-DC converter for powering 12V loads from a 24V battery bank. Ideal for mixed-voltage systems and vehicle solar setups.',
    priceLabel: 'Contact for pricing',
    relatedService: 'bess',
  },
  {
    id: 'epever-ip500w',
    name: 'EPEVER IP 500W Pure Sine Wave',
    brand: 'EPEVER',
    category: 'converters',
    specs: '500W · 12V DC→230V AC · Pure Sine Wave',
    description:
      'Compact pure sine wave inverter-converter for powering sensitive AC equipment from a 12V battery. USB charging port included.',
    priceLabel: 'Contact for pricing',
    badge: 'New',
    relatedService: 'bess',
  },
];
