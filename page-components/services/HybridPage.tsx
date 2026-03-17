import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function HybridPage() {
  return (
    <ServicePageLayout
      serviceId="hybrid"
      title="Hybrid Solar Systems"
      tagline="The best of both worlds — solar power, battery backup, and grid connection in one unified system."
      heroBgImage={bg4}
      iconName="Sun"
      overview="A hybrid solar system combines solar panels, a battery storage bank, and a grid connection to give you maximum flexibility, reliability, and savings. It is the most versatile solar setup available — powering your home or business during the day from solar, storing excess energy for nighttime use, and drawing from the grid only when needed."
      whatIsIt="A hybrid solar system is a grid-tied photovoltaic (PV) installation that also includes a battery energy storage system (BESS). Unlike a purely on-grid system that shuts down during outages, or a fully off-grid system that relies entirely on batteries, a hybrid system intelligently manages three energy sources — your solar array, your battery bank, and the utility grid. A hybrid inverter acts as the brain, routing power between these sources based on availability and demand. In the Philippines, hybrid systems typically pair a Sofar, Solax, or Deye inverter with lithium iron phosphate (LFP) batteries to deliver 24/7 reliable power even during brownouts."
      howItWorks={[
        {
          step: 'Solar Generation',
          description: 'Photovoltaic panels on your roof or ground mount convert sunlight into DC electricity. Output depends on panel wattage, roof orientation, and sunlight hours — Leyte averages 4.5–5.5 peak sun hours per day.',
        },
        {
          step: 'Hybrid Inverter Conversion',
          description: 'The hybrid inverter converts DC power to AC for household use, simultaneously managing charging of the battery bank and synchronizing with the grid. It monitors all three sources in real time.',
        },
        {
          step: 'Battery Charging & Storage',
          description: 'Excess solar energy not consumed immediately is stored in lithium LFP batteries. A fully charged 10 kWh battery bank can power a typical Filipino home through the night and beyond.',
        },
        {
          step: 'Grid Backup & Net Metering',
          description: 'When batteries are full and solar is still producing, excess power is exported to the grid. When solar and battery are insufficient, the grid supplements — all managed automatically with zero manual switching.',
        },
        {
          step: 'Blackout Protection',
          description: 'During grid outages, the hybrid inverter islands your system and continues supplying power from solar and batteries — a capability that purely on-grid systems cannot provide.',
        },
      ]}
      benefits={[
        { iconName: 'ShieldCheck', title: 'Brownout Protection', description: 'Battery backup keeps critical loads running during Visayas grid interruptions, which average 8–12 hours per month in some areas.' },
        { iconName: 'TrendingDown', title: 'Dramatically Lower Bills', description: 'Most households eliminate 70–100% of their electric bill. A properly sized 6 kW hybrid system in Ormoc can save ₱4,000–₱8,000 per month.' },
        { iconName: 'RefreshCw', title: 'Net Metering Ready', description: 'Export surplus power to VECO/LEYTE SAMAR ELECTRIC CO. and earn credits under the Philippine Net Metering Program (ERC Resolution No. 09, Series of 2013).' },
        { iconName: 'Leaf', title: 'Zero Carbon Operation', description: 'Reduce your household carbon footprint by up to 4 tonnes of CO₂ per year — equivalent to planting over 180 trees annually.' },
        { iconName: 'Smartphone', title: 'Remote Monitoring', description: 'Monitor generation, battery state, and consumption in real time via mobile app (Sofar ME3000, Solax Cloud, or equivalent).' },
        { iconName: 'Banknote', title: 'ROI in 4–7 Years', description: 'With current electricity rates and system costs, most Philippine hybrid solar investments pay back in 4–7 years against a 25-year panel lifespan.' },
      ]}
      useCases={[
        'Residential homes in areas with frequent brownouts',
        'Small businesses and retail stores requiring 24/7 power',
        'Home offices and remote workers dependent on stable internet and equipment',
        'Properties in semi-rural areas with unstable grid supply',
        'Homeowners wanting to future-proof against rising electricity tariffs',
      ]}
      specs={[
        { label: 'Typical System Size', value: '6 kW – 100 kW+' },
        { label: 'Battery Chemistry', value: 'Lithium Iron Phosphate (LFP)' },
        { label: 'Battery Capacity', value: '5 kWh – 100 kWh+' },
        { label: 'Panel Type', value: 'Monocrystalline PERC / TOPCon' },
        { label: 'Inverter Brands', value: 'Sofar Solar, Solax Power, Deye' },
        { label: 'Battery Life', value: '10–15 years (>4,000 cycles at 80% DoD)' },
        { label: 'Panel Warranty', value: '25-year linear power output warranty' },
        { label: 'Installation Time', value: '1–3 days depending on system size' },
      ]}
      sources={[
        { title: 'Net Metering Guidelines for Renewable Energy', url: 'https://www.erc.gov.ph', publisher: 'Energy Regulatory Commission (ERC) Philippines' },
        { title: 'Renewable Energy Act of 2008 (RA 9513)', url: 'https://www.doe.gov.ph', publisher: 'Department of Energy Philippines' },
        { title: 'Utility-Scale Battery Storage', url: 'https://www.nrel.gov', publisher: 'National Renewable Energy Laboratory (NREL)' },
        { title: 'Solar PV — Technology Brief', url: 'https://www.irena.org', publisher: 'International Renewable Energy Agency (IRENA)' },
        { title: 'Sofar Hybrid Inverter Product Documentation', url: 'https://www.sofarsolar.com', publisher: 'Sofar Solar' },
      ]}
    />
  );
}