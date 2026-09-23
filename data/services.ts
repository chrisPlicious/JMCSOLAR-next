import type { ClientType } from '../types';

/**
 * Services are defined here in code, not in Firestore.
 *
 * Previously both the service cards and their long-form detail content lived in
 * the `services` / `serviceDetails` Firestore collections behind an admin CRUD
 * UI. That CMS was harder to use than editing this file, and the data drifted
 * (duplicate detail docs, orphaned records, a display_order gap, typos shipped to
 * production). Adding or editing a service is now a code change + deploy, which
 * matches how locations (`data/locations.ts`) and products are already handled.
 *
 * To add a service: append to SERVICES, add a matching SERVICE_DETAILS entry, and
 * drop a photo at public/assets/services/<slug>.jpg. `icon` and `benefits[].iconName`
 * must be valid lucide-react export names.
 */

export interface ServiceStep {
  step: string;
  description: string;
}

export interface ServiceBenefit {
  /** lucide-react export name */
  iconName: string;
  title: string;
  description: string;
}

export interface ServiceSpec {
  label: string;
  value: string;
}

export interface ServiceSource {
  title: string;
  url: string;
  publisher: string;
}

/** Long-form body of a /services/[slug] page. Server-only — never pass to a client component. */
export interface ServiceDetail {
  tagline: string;
  overview: string;
  what_is_it: string;
  how_it_works: ServiceStep[];
  benefits: ServiceBenefit[];
  use_cases: string[];
  specs: ServiceSpec[];
  sources: ServiceSource[];
}

/** Card-level fields. Light enough to pass to client components as props. */
export interface Service {
  slug: string;
  title: string;
  description: string;
  /** lucide-react export name */
  icon: string;
  highlight: boolean;
  display_order: number;
  photo_url?: string;
  /** Hand-maintained ISO date, used for sitemap lastModified. Bump when you edit a service. */
  updated_at: string;
}

/** Already in display order. */
export const SERVICES: Service[] = [
  {
    slug: 'hybrid',
    title: 'Hybrid Solar Systems',
    description:
      '6kW to 100kW+ hybrid systems combining solar generation, battery storage, and grid connection for maximum reliability and energy savings.',
    icon: 'Sun',
    highlight: true,
    display_order: 1,
    photo_url: '/assets/services/hybrid.jpg',
    updated_at: '2026-06-12T03:40:52.319Z',
  },
  {
    slug: 'ongrid',
    title: 'On-Grid / Net-Metered',
    description:
      'Feed excess solar power back to the utility grid and earn credits on your electricity bill with our DOE/ERC-compliant net metering installations.',
    icon: 'Zap',
    highlight: false,
    display_order: 2,
    photo_url: '/assets/services/ongrid.jpg',
    updated_at: '2026-05-09T06:36:48.192Z',
  },
  {
    slug: 'pump',
    title: 'Solar Pumping Systems',
    description:
      'Cost-effective solar-powered water pumps for agricultural and irrigation applications. Zero electricity cost for your farm operations.',
    icon: 'Droplets',
    highlight: false,
    display_order: 3,
    photo_url: '/assets/services/pump.jpg',
    updated_at: '2026-05-09T06:35:34.459Z',
  },
  {
    slug: 'ev',
    title: 'EV Charger Installation',
    description:
      'Future-proof your property with professional EV charging station installation. Charge your electric vehicle using clean, free solar energy.',
    icon: 'Car',
    highlight: false,
    display_order: 4,
    photo_url: '/assets/services/ev.jpg',
    updated_at: '2026-05-09T06:35:56.706Z',
  },
  {
    slug: 'ups',
    title: 'UPS Systems',
    description:
      'Uninterruptible Power Supply systems to protect sensitive equipment and keep critical operations running during power interruptions and outages.',
    icon: 'ShieldCheck',
    highlight: false,
    display_order: 5,
    updated_at: '2026-03-19T01:31:10.658774+00:00',
  },
  {
    slug: 'operation-maintenance',
    title: 'Operation & Maintenance',
    description:
      'Your solar system is a long-term investment — and like any asset, it needs consistent care to deliver maximum returns. JMC Solar PH\'s Operations & Maintenance service ensures your system runs at peak performance year-round, preventing costly breakdowns before they happen and resolving issues fast when they do.',
    icon: 'Wrench',
    highlight: false,
    display_order: 6,
    photo_url: '/assets/services/operation-maintenance.jpg',
    updated_at: '2026-05-09T06:40:52.718Z',
  },
];

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'hybrid': {
    tagline: 'The best of both worlds — solar power, battery backup, and grid connection in one unified system.',
    overview:
      'A hybrid solar system combines solar panels, a battery storage bank, and a grid connection to give you maximum flexibility, reliability, and savings. It is the most versatile solar setup available — powering your home or business during the day from solar, storing excess energy for nighttime use, and drawing from the grid only when needed.',
    what_is_it:
      'A hybrid solar system is a grid-tied photovoltaic (PV) installation that also includes a battery energy storage system (BESS). Unlike a purely on-grid system that shuts down during outages, or a fully off-grid system that relies entirely on batteries, a hybrid system intelligently manages three energy sources — your solar array, your battery bank, and the utility grid. A hybrid inverter acts as the brain, routing power between these sources based on availability and demand. In the Philippines, hybrid systems typically pair a Sofar, Solax, or Deye inverter with lithium iron phosphate (LFP) batteries to deliver 24/7 reliable power even during brownouts.',
    how_it_works: [
      { step: 'Solar Generations', description: 'Photovoltaic panels on your roof or ground mount convert sunlight into DC electricity. Output depends on panel wattage, roof orientation, and sunlight hours — Leyte averages 4.5–5.5 peak sun hours per day.' },
      { step: 'Hybrid Inverter Conversion', description: 'The hybrid inverter converts DC power to AC for household use, simultaneously managing charging of the battery bank and synchronizing with the grid. It monitors all three sources in real time.' },
      { step: 'Battery Charging & Storage', description: 'Excess solar energy not consumed immediately is stored in lithium LFP batteries. A fully charged 10 kWh battery bank can power a typical Filipino home through the night and beyond.' },
      { step: 'Grid Backup & Net Metering', description: 'When batteries are full and solar is still producing, excess power is exported to the grid. When solar and battery are insufficient, the grid supplements — all managed automatically with zero manual switching.' },
      { step: 'Blackout Protection', description: 'During grid outages, the hybrid inverter islands your system and continues supplying power from solar and batteries — a capability that purely on-grid systems cannot provide.' },
    ],
    benefits: [
      { iconName: 'ShieldCheck', title: 'Brownout Protection', description: 'Battery backup keeps critical loads running during Visayas grid interruptions, which average 8–12 hours per month in some areas.' },
      { iconName: 'TrendingDown', title: 'Dramatically Lower Bills', description: 'Most households eliminate 70–100% of their electric bill. A properly sized 6 kW hybrid system in Ormoc can save ₱4,000–₱8,000 per month.' },
      { iconName: 'RefreshCw', title: 'Net Metering Ready', description: 'Export surplus power to VECO/LEYTE SAMAR ELECTRIC CO. and earn credits under the Philippine Net Metering Program (ERC Resolution No. 09, Series of 2013).' },
      { iconName: 'Leaf', title: 'Zero Carbon Operation', description: 'Reduce your household carbon footprint by up to 4 tonnes of CO₂ per year — equivalent to planting over 180 trees annually.' },
      { iconName: 'Smartphone', title: 'Remote Monitoring', description: 'Monitor generation, battery state, and consumption in real time via mobile app (Sofar ME3000, Solax Cloud, or equivalent).' },
      { iconName: 'Banknote', title: 'ROI in 2-3 Years', description: 'With current electricity rates and system costs, most Philippine hybrid solar investments pay back in 4–7 years against a 25-year panel lifespan.' },
    ],
    use_cases: [
      'Residential homes in areas with frequent brownouts',
      'Small businesses and retail stores requiring 24/7 power',
      'Home offices and remote workers dependent on stable internet and equipment',
      'Properties in semi-rural areas with unstable grid supply',
      'Homeowners wanting to future-proof against rising electricity tariffs',
    ],
    specs: [
      { label: 'Typical System Size', value: '6 kW – 100 kW+' },
      { label: 'Battery Chemistry', value: 'Lithium Iron Phosphate (LFP)' },
      { label: 'Battery Capacity', value: '5 kWh – 100 kWh+' },
      { label: 'Panel Type', value: 'Monocrystalline PERC / TOPCon' },
      { label: 'Inverter Brands', value: 'Sofar Solar, Solax Power, Deye' },
      { label: 'Battery Life', value: '10–15 years (>4,000 cycles at 80% DoD)' },
      { label: 'Panel Warranty', value: '25-year linear power output warranty' },
      { label: 'Installation Time', value: '1–3 days depending on system size' },
    ],
    sources: [
      { title: 'Net Metering Guidelines for Renewable Energy', url: 'https://www.erc.gov.ph', publisher: 'Energy Regulatory Commission (ERC) Philippines' },
      { title: 'Renewable Energy Act of 2008 (RA 9513)', url: 'https://www.doe.gov.ph', publisher: 'Department of Energy Philippines' },
      { title: 'Utility-Scale Battery Storage', url: 'https://www.nrel.gov', publisher: 'National Renewable Energy Laboratory (NREL)' },
      { title: 'Solar PV — Technology Brief', url: 'https://www.irena.org', publisher: 'International Renewable Energy Agency (IRENA)' },
    ],
  },
  'ongrid': {
    tagline: 'Feed the grid, earn credits, and slash your electricity bill — the simplest and most affordable solar option.',
    overview:
      'An on-grid (grid-tied) solar system connects your solar panels directly to the utility grid without batteries. During the day, solar powers your home and any surplus is exported to the grid for credits. It is the most cost-effective solar installation because it removes the battery expense while still delivering significant monthly savings.',
    what_is_it:
      'An on-grid solar system consists of solar panels wired to a grid-tied inverter, which converts DC electricity to grid-synchronized AC power. When your panels produce more electricity than you consume, the excess flows backward through your meter to the utility grid — a process called net metering. Under Philippine law (RA 9513 and ERC Net Metering Rules), distribution utilities like VECO are required to accept this surplus and credit you at the blended generation rate. At night or on cloudy days, you draw normally from the grid. There are no batteries, making this the simplest and lowest-cost solar option available.',
    how_it_works: [
      { step: 'Solar Panel Generation', description: 'Panels produce DC power proportional to sunlight intensity. A south-facing or flat roof in Leyte can generate 4–5 kWh per installed kWp on an average day.' },
      { step: 'Grid-Tie Inverter Conversion', description: 'A grid-tie inverter converts DC to AC at exactly the same frequency and phase as the grid (60 Hz in the Philippines). This synchronization is required for safe export.' },
      { step: 'Load Priority', description: 'Solar power first satisfies your own loads (appliances, lights, etc.). If generation exceeds consumption, surplus flows to the grid.' },
      { step: 'Bidirectional Meter & Net Metering', description: 'A DOE/ERC-approved bidirectional meter records both import and export. Your monthly bill deducts your export credits from your consumption, reducing the amount owed.' },
      { step: 'Automatic Grid Safety Shutdown', description: 'On-grid inverters include anti-islanding protection — they automatically shut down during grid outages for safety, restarting automatically when the grid is restored.' },
    ],
    benefits: [
      { iconName: 'Banknote', title: 'Lowest Upfront Cost', description: 'No batteries means 30–50% lower installation cost compared to hybrid systems. A 5 kW on-grid system in the Philippines typically costs ₱180,000–₱280,000 installed.' },
      { iconName: 'Receipt', title: 'Earn Bill Credits', description: 'Exported kWh are credited at your utility\'s blended generation rate. Homes with large daytime loads (offices, businesses) can achieve near-zero monthly bills.' },
      { iconName: 'Timer', title: 'Fastest Payback', description: 'With no battery costs, on-grid systems can pay back in 2-3 years — the shortest ROI of any solar configuration at current Leyte electricity rates.' },
      { iconName: 'Wrench', title: 'Minimal Maintenance', description: 'No moving parts, no battery replacement, no electrolyte checks. Panels require only occasional cleaning; inverters are rated for 10–15 years of service.' },
      { iconName: 'Scale', title: 'Scalable Design', description: 'Start with a smaller system and add panels later. Batteries can be added at any time to upgrade to a hybrid setup as your needs or budget change.' },
      { iconName: 'Globe', title: 'Environmental Impact', description: 'A 5 kW system offsets approximately 3 tonnes of CO₂ per year — the equivalent of removing one car from the road annually.' },
    ],
    use_cases: [
      'Residential homes with stable grid supply and predictable daytime usage',
      'Offices and commercial buildings operating primarily during daylight hours',
      'Schools, churches, and community buildings with daytime-heavy loads',
      'Businesses looking for the fastest return on solar investment',
      'Properties where budget constraints make battery systems impractical',
    ],
    specs: [
      { label: 'Typical System Size', value: '3 kW – 100 kW+' },
      { label: 'Inverter Type', value: 'Grid-Tie (no battery port)' },
      { label: 'Panel Type', value: 'Monocrystalline PERC / TOPCon' },
      { label: 'Net Metering Eligibility', value: 'Up to 100 kW under RA 9513' },
      { label: 'Credit Rate', value: 'Blended generation rate (utility-set)' },
      { label: 'Inverter Lifespan', value: '10–15 years' },
      { label: 'Panel Warranty', value: '25-year linear power output warranty' },
      { label: 'Grid Compliance', value: 'DOE/ERC-compliant anti-islanding protection' },
    ],
    sources: [
      { title: 'Net Metering Rules and Regulations', url: 'https://www.erc.gov.ph', publisher: 'Energy Regulatory Commission (ERC) Philippines' },
      { title: 'Renewable Energy Act of 2008 (RA 9513)', url: 'https://www.doe.gov.ph', publisher: 'Department of Energy Philippines' },
      { title: 'Grid-Connected Photovoltaic Systems', url: 'https://www.irena.org', publisher: 'IRENA' },
      { title: 'Solar Photovoltaic System Basics', url: 'https://www.nrel.gov', publisher: 'NREL' },
    ],
  },
  'pump': {
    tagline: 'Power your irrigation and water supply with the sun — zero fuel, zero electricity bill.',
    overview:
      'Solar pumping systems use photovoltaic panels to power water pumps for irrigation, livestock watering, domestic supply, and fish pond management — eliminating diesel or electricity costs entirely. They are ideal for farms and remote properties in Eastern Visayas where fuel prices and grid unreliability make traditional pumping expensive.',
    what_is_it:
      'A solar pumping system consists of a solar array, a solar pump controller (also called a VFD or MPPT pump drive), and a water pump (submersible, surface, or centrifugal). The controller converts solar DC power to variable-frequency AC to drive the pump motor, adjusting pump speed in real time based on available sunlight. No batteries are required — the pump simply runs whenever there is sufficient sun, storing energy in the form of water in a tank or pond. For overnight or cloudy-day operation, a small battery bank or grid backup can be added. These systems are promoted by the FAO and World Bank as a cost-effective solution for smallholder farmers in developing nations.',
    how_it_works: [
      { step: 'Solar Panel Array', description: 'Panels are sized to the pump motor\'s power rating. A 1 kW submersible pump typically needs 1.5–2 kWp of panels to account for losses and operate under partial cloud.' },
      { step: 'MPPT Pump Controller', description: 'The controller tracks the maximum power point of the solar array and converts it to the right voltage and frequency for the pump motor. It also provides dry-run protection and fault monitoring.' },
      { step: 'Water Pumping', description: 'The pump lifts water from a well, river, or pond. Submersible pumps are used for deep wells (10–100 m+); surface pumps for shallow sources. Flow rate depends on pump size and solar availability.' },
      { step: 'Storage Tank Buffering', description: 'Water is pumped during daylight into an elevated tank or reservoir, providing gravity-fed supply throughout the day and night without batteries.' },
    ],
    benefits: [
      { iconName: 'Fuel', title: 'Zero Fuel Cost', description: 'Diesel pump operators in Eastern Visayas spend ₱500–₱2,000 per day on fuel. Solar pumping eliminates this cost entirely — the sun is free.' },
      { iconName: 'Leaf', title: 'Eco-Friendly Irrigation', description: 'No emissions, no noise, no diesel spills. Solar pumps protect the surrounding soil and water table from fuel contamination.' },
      { iconName: 'Wrench', title: 'Low Maintenance', description: 'Solar pump systems have fewer moving parts than diesel engines. With no combustion components, service intervals are minimal — typically an annual inspection.' },
      { iconName: 'MapPin', title: 'Works Anywhere', description: 'No grid connection required. Ideal for farms, highlands, and coastal areas in Leyte, Samar, and surrounding islands where grid access is limited or unreliable.' },
      { iconName: 'Sprout', title: 'Supports Food Security', description: 'Reliable, affordable irrigation enables year-round cropping instead of rain-fed farming — directly increasing harvest yields and farm income.' },
      { iconName: 'Banknote', title: 'Fast Payback', description: 'At ₱1,000/day in diesel savings, a ₱150,000 solar pump system pays back in under 6 months for continuous-use agricultural applications.' },
    ],
    use_cases: [
      'Rice and vegetable irrigation in Leyte, Samar, and surrounding islands',
      'Coconut plantation irrigation and fertilizer injection',
      'Livestock and poultry farm water supply',
      'Fishpond water circulation and oxygenation',
      'Domestic water supply for remote barangays without grid power',
      'Community water systems and Level II water supply projects',
    ],
    specs: [
      { label: 'Pump Types', value: 'Submersible, Surface, Centrifugal' },
      { label: 'Motor Power Range', value: '0.37 kW – 22 kW+' },
      { label: 'Max Head (Submersible)', value: 'Up to 200 m' },
      { label: 'Flow Rate', value: '1 m³/hr – 100 m³/hr depending on size' },
      { label: 'Controller Type', value: 'MPPT Variable Frequency Drive (VFD)' },
      { label: 'Panel Requirement', value: '~1.5× pump motor rated power' },
      { label: 'Battery Optional', value: 'Yes — for cloudy/night operation' },
      { label: 'Supported Brands', value: 'Lorentz, Franklin, Grundfos solar series' },
    ],
    sources: [
      { title: 'Solar Powered Irrigation Systems', url: 'https://www.fao.org', publisher: 'Food and Agriculture Organization (FAO)' },
      { title: 'Solar Water Pumping for Agriculture', url: 'https://www.worldbank.org', publisher: 'World Bank' },
      { title: 'Solar Pumping Fundamentals', url: 'https://www.irena.org', publisher: 'IRENA' },
      { title: 'Philippine Solar Irrigation Program', url: 'https://www.da.gov.ph', publisher: 'Department of Agriculture Philippines' },
    ],
  },
  'ev': {
    tagline: 'Charge your electric vehicle at home using clean solar energy — for almost nothing per kilometer.',
    overview:
      'With the rapid growth of electric vehicles (EVs) in the Philippines, having a dedicated home or business EV charging station is no longer a luxury — it is a practical necessity. When paired with solar panels, you can charge your vehicle with energy that costs a fraction of the grid rate, making every kilometer essentially free.',
    what_is_it:
      'An EV charger (Electric Vehicle Supply Equipment or EVSE) is a device that safely delivers AC or DC power to an electric vehicle\'s onboard charger or battery pack. Home and commercial chargers are classified by level: Level 1 (standard 230 V outlet, slow), Level 2 (dedicated 7–22 kW AC charger, fast), and Level 3 (DC fast charger, 50–350 kW, commercial). JMC Solar PH specializes in Level 2 AC wall-box installations for homes and businesses — the sweet spot of cost, convenience, and charging speed. When combined with an existing solar system, an EV charger effectively turns your car\'s fuel cost into a near-zero solar-powered expense.',
    how_it_works: [
      { step: 'Dedicated Circuit Installation', description: 'A licensed electrician installs a dedicated 32 A or 40 A circuit from your distribution board to the charger location — typically the garage or carport.' },
      { step: 'Wall-Box Charger Mounting', description: 'The EVSE unit is wall-mounted, weatherproofed (IP54+), and connected to the dedicated circuit. It includes safety features: ground fault protection, over-current protection, and thermal monitoring.' },
      { step: 'Vehicle Connection via J1772 or Type 2', description: 'The charger supplies AC power through a standardized connector. The vehicle\'s onboard charger converts AC to DC for the battery pack. Communication between charger and vehicle manages safe charge limits.' },
      { step: 'Solar Integration (Optional)', description: 'When paired with a solar + BESS system, the EV charger can be configured to prioritize solar charging — charging your car only when solar excess is available, maximizing free energy use.' },
    ],
    benefits: [
      { iconName: 'Zap', title: 'Fast Home Charging', description: 'A 7.4 kW Level 2 charger adds roughly 30–40 km of range per hour — a full overnight charge covers 200–350 km for most EVs on the market.' },
      { iconName: 'Banknote', title: 'Solar-Powered Driving', description: 'With solar panels, charging cost drops to ₱0 per km from solar, vs. ₱1.50–₱2.50 per km from the grid and ₱4–₱7 per km from petrol.' },
      { iconName: 'Shield', title: 'Safe & Standards-Compliant', description: 'Proper EVSE installation prevents the risks of using standard outlets (overheating, fire). All installations comply with the Philippine Electrical Code (PEC) and IEC 61851.' },
      { iconName: 'Smartphone', title: 'Smart Charging Controls', description: 'Schedule charging for off-peak hours or solar surplus periods via mobile app. Monitor energy used, cost savings, and charging history.' },
      { iconName: 'Building2', title: 'Property Value', description: 'EV charging capability is increasingly a key selling point for residential and commercial properties as EV adoption accelerates in the Philippines.' },
      { iconName: 'Globe', title: 'Zero Local Emissions', description: 'EV + solar = zero tailpipe emissions and zero carbon charging. Contribute directly to the Philippines\' NDC targets and clean air goals.' },
    ],
    use_cases: [
      'Homeowners with EVs (BYD, Nissan Leaf, MG ZS EV, etc.) wanting convenient home charging',
      'Businesses providing charging amenities for customers or employees',
      'Hotels, resorts, and commercial establishments attracting EV-driving guests',
      'Fleet operators (delivery vans, company cars) centralizing overnight charging',
      'Solar system owners wanting to maximize self-consumption through EV charging',
    ],
    specs: [
      { label: 'Output Power', value: '7.4 kW (32 A) – 22 kW (32 A, 3-phase)' },
      { label: 'Connector Standard', value: 'IEC 62196 Type 2 / J1772 Type 1' },
      { label: 'Charging Speed', value: '~30–120 km of range per hour' },
      { label: 'Protection Rating', value: 'IP54 minimum (outdoor rated)' },
      { label: 'Electrical Requirement', value: 'Dedicated 32 A – 40 A circuit' },
      { label: 'Smart Features', value: 'App control, scheduling, solar integration' },
      { label: 'Standards Compliance', value: 'IEC 61851, Philippine Electrical Code' },
    ],
    sources: [
      { title: 'Global EV Outlook 2024', url: 'https://www.iea.org', publisher: 'IEA' },
      { title: 'Electric Vehicle Charging Infrastructure', url: 'https://www.nrel.gov', publisher: 'NREL' },
      { title: 'EV Adoption in Southeast Asia', url: 'https://www.irena.org', publisher: 'IRENA' },
      { title: 'Electric Vehicle Industry Development Act (RA 11697)', url: 'https://www.doe.gov.ph', publisher: 'DOE Philippines' },
    ],
  },
  'ups': {
    tagline: 'Protect your equipment and keep critical operations running through every power interruption.',
    overview:
      'An Uninterruptible Power Supply (UPS) provides instant battery backup when mains power fails or fluctuates. It protects sensitive electronics from voltage surges, brownouts, and blackouts — safeguarding computers, servers, medical devices, and industrial equipment from data loss, damage, and costly downtime.',
    what_is_it:
      'A UPS is a device containing a battery (or battery bank), a rectifier/charger, and an inverter. It sits between the utility power supply and your connected loads. When grid power is normal, the UPS charges its battery while powering the connected load — in some topologies, through the inverter at all times (online/double-conversion), providing complete isolation from grid power quality issues. When power fails, the inverter seamlessly switches to battery power with zero to near-zero transfer time. UPS systems range from small desktop units (500 VA) to large three-phase industrial installations (hundreds of kVA). For solar hybrid users, a UPS complements the solar system by protecting loads during the brief inverter switching time and filtering power quality issues.',
    how_it_works: [
      { step: 'Normal Operation', description: 'Grid AC powers the load. In offline/standby UPS: power flows directly through the unit. In online/double-conversion: all power is rectified to DC and re-inverted to clean AC, providing total isolation.' },
      { step: 'Battery Charging', description: 'An internal rectifier and charger keeps the battery bank fully charged at all times, ready for instant deployment.' },
      { step: 'Power Failure Response', description: 'When mains power is interrupted, the UPS\'s internal inverter supplies battery power to connected loads. Offline UPS transfer time: 4–12 ms. Online UPS: 0 ms (no transfer at all).' },
      { step: 'Voltage Regulation', description: 'Many UPS models include AVR (Automatic Voltage Regulation), correcting brownouts and overvoltages without switching to battery — extending battery life and protecting equipment from power quality issues common in Philippine grids.' },
      { step: 'Load Shedding & Runtime', description: 'Runtime depends on battery capacity and connected load. A 1 kVA UPS with standard battery provides ~10–20 minutes for a PC. Extended battery modules can provide hours of runtime for critical loads.' },
    ],
    benefits: [
      { iconName: 'Monitor', title: 'Equipment Protection', description: 'Prevents expensive damage to computers, servers, medical equipment, and industrial controllers caused by voltage spikes, surges, and unclean power.' },
      { iconName: 'Database', title: 'Data & Work Protection', description: 'Provides enough time to save work and perform a clean system shutdown during extended outages — preventing data corruption and hardware damage from abrupt power loss.' },
      { iconName: 'Activity', title: 'Business Continuity', description: 'For businesses, every minute of downtime has a cost. A UPS ensures operations continue through the brief, frequent brownouts common in Visayas.' },
      { iconName: 'Gauge', title: 'Power Quality Conditioning', description: 'Line-interactive and online UPS models regulate voltage continuously, correcting brownouts and overvoltages without battery cycling — crucial in areas with unstable grid voltage.' },
      { iconName: 'Wifi', title: 'Network & Internet Uptime', description: 'Keep your routers, switches, and fiber ONTs powered through outages for continuous internet and communication — critical for home offices and remote workers.' },
      { iconName: 'Zap', title: 'Solar System Complement', description: 'In a solar hybrid setup, a UPS covers the brief (<20 ms) switching window of the hybrid inverter during blackouts, providing completely seamless power for sensitive electronics.' },
    ],
    use_cases: [
      'Home offices and remote workers (PC, router, monitors)',
      'Medical clinics and pharmacies (refrigerators, diagnostic equipment)',
      'CCTV systems and security infrastructure',
      'Network server rooms and data centers',
      'POS systems and retail cash registers',
      'Industrial control panels and automation equipment',
    ],
    specs: [
      { label: 'UPS Topologies', value: 'Offline/Standby, Line-Interactive, Online (Double-Conversion)' },
      { label: 'Capacity Range', value: '500 VA – 500 kVA' },
      { label: 'Transfer Time (Offline)', value: '4–12 milliseconds' },
      { label: 'Transfer Time (Online)', value: '0 milliseconds' },
      { label: 'Battery Type', value: 'VRLA AGM (standard), Lithium-Ion (premium)' },
      { label: 'Typical Runtime (1 kVA, full load)', value: '10–20 minutes (ext. battery: hours)' },
      { label: 'Efficiency (Online)', value: '94–97% (eco mode up to 99%)' },
      { label: 'Supported Brands', value: 'Voltronic Power, APC, Eaton, Mecer' },
    ],
    sources: [
      { title: 'Uninterruptible Power Supplies — Technical Overview', url: 'https://www.iec.ch', publisher: 'International Electrotechnical Commission (IEC)' },
      { title: 'Power Quality and UPS Systems', url: 'https://www.nrel.gov', publisher: 'NREL' },
      { title: 'Voltronic Power UPS Technical Documentation', url: 'https://www.voltronicpower.com', publisher: 'Voltronic Power' },
      { title: 'Business Continuity and Power Protection', url: 'https://www.iea.org', publisher: 'IEA' },
    ],
  },
  'operation-maintenance': {
    tagline: 'Keep your solar investment performing at peak efficiency with scheduled preventive care and rapid-response corrective support — extending system lifespan and protecting your ROI.',
    overview:
      'Preventive Maintenance covers scheduled cleaning of solar panels to remove dust, debris, and bird droppings that silently cut power output — studies show soiled panels can lose 15–25% efficiency. Our technicians also conduct thorough physical inspections of panels, inverters, wiring, and mounting structures to catch degradation, corrosion, or loose connections early.',
    what_is_it:
      'Corrective Maintenance gives you peace of mind knowing that when your system throws a fault or alarm, a trained technician responds quickly. We troubleshoot system issues, repair or replace defective components — inverters, breakers, cables — and provide emergency on-call support so downtime is minimized and your energy savings stay uninterrupted.',
    how_it_works: [
      { step: 'Assessment', description: 'System audit to establish baseline performance and maintenance schedule' },
      { step: 'Preventive visits', description: 'Scheduled panel cleaning, visual inspection of panels, inverters, wiring, and mounting structures' },
      { step: 'Performance monitoring', description: 'Remote monitoring of system output; alerts on underperformance or faults' },
      { step: 'Corrective response', description: 'On-call troubleshooting for faults/alarms; repair or replacement of defective components (inverters, breakers, cables)' },
      { step: 'Service report', description: 'Post-visit report with findings, actions taken, and next scheduled maintenance' },
    ],
    benefits: [],
    use_cases: [],
    specs: [],
    sources: [],
  },
};

/** All services, in display order. */
export function getServices(): Service[] {
  return SERVICES;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** The long-form detail for a service, or null when none is written yet. */
export function getServiceDetail(slug: string): ServiceDetail | null {
  return SERVICE_DETAILS[slug] ?? null;
}

export type NavService = { slug: string; title: string };

/**
 * Nav/footer links. Derived from SERVICES so they can never drift out of sync —
 * a slim { slug, title } projection so the heavy descriptions stay server-side.
 */
export const NAV_SERVICES: NavService[] = SERVICES.map(({ slug, title }) => ({ slug, title }));

export const clientTypes: ClientType[] = [
  {
    id: 'residential',
    icon: 'Home',
    title: 'Residential',
    description:
      'We bring clean, reliable solar energy to homes — from grid-tied systems to full hybrid setups with battery backup for 24/7 power.',
    image: '/assets/clients/resedential.jpg',
    badge: 'residential',
  },
  {
    id: 'commercial',
    icon: 'Building2',
    title: 'Commercial',
    description:
      'Reduce operating costs and meet sustainability goals with commercial-scale solar installations tailored to your business needs.',
    image: '/assets/clients/commercial.jpeg',
    badge: 'commercial',
  },
  {
    id: 'agricultural',
    icon: 'Sprout',
    title: 'Agricultural',
    description:
      'Power irrigation pumps and farm operations at zero fuel cost using solar pumping and off-grid systems built for the field.',
    image: '/assets/clients/agricultural.jpg',
    badge: 'agricultural',
  },
  {
    id: 'industrial',
    icon: 'Factory',
    title: 'Industrial',
    description:
      'High-capacity solar solutions for manufacturing plants, warehouses, and industrial facilities that demand uninterrupted power.',
    image: '/assets/clients/industrial.jpg',
    badge: 'industrial',
  },
];
