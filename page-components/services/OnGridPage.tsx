import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function OnGridPage() {
  return (
    <ServicePageLayout
      serviceId="ongrid"
      title="On-Grid / Net-Metered Solar"
      tagline="Feed the grid, earn credits, and slash your electricity bill — the simplest and most affordable solar option."
      heroBgImage={bg4}
      iconName="Zap"
      overview="An on-grid (grid-tied) solar system connects your solar panels directly to the utility grid without batteries. During the day, solar powers your home and any surplus is exported to the grid for credits. It is the most cost-effective solar installation because it removes the battery expense while still delivering significant monthly savings."
      whatIsIt="An on-grid solar system consists of solar panels wired to a grid-tied inverter, which converts DC electricity to grid-synchronized AC power. When your panels produce more electricity than you consume, the excess flows backward through your meter to the utility grid — a process called net metering. Under Philippine law (RA 9513 and ERC Net Metering Rules), distribution utilities like VECO are required to accept this surplus and credit you at the blended generation rate. At night or on cloudy days, you draw normally from the grid. There are no batteries, making this the simplest and lowest-cost solar option available."
      howItWorks={[
        {
          step: 'Solar Panel Generation',
          description: 'Panels produce DC power proportional to sunlight intensity. A south-facing or flat roof in Leyte can generate 4–5 kWh per installed kWp on an average day.',
        },
        {
          step: 'Grid-Tie Inverter Conversion',
          description: 'A grid-tie inverter converts DC to AC at exactly the same frequency and phase as the grid (60 Hz in the Philippines). This synchronization is required for safe export.',
        },
        {
          step: 'Load Priority',
          description: 'Solar power first satisfies your own loads (appliances, lights, etc.). If generation exceeds consumption, surplus flows to the grid.',
        },
        {
          step: 'Bidirectional Meter & Net Metering',
          description: 'A DOE/ERC-approved bidirectional meter records both import and export. Your monthly bill deducts your export credits from your consumption, reducing the amount owed.',
        },
        {
          step: 'Automatic Grid Safety Shutdown',
          description: 'On-grid inverters include anti-islanding protection — they automatically shut down during grid outages for safety, restarting automatically when the grid is restored.',
        },
      ]}
      benefits={[
        { iconName: 'Banknote', title: 'Lowest Upfront Cost', description: 'No batteries means 30–50% lower installation cost compared to hybrid systems. A 5 kW on-grid system in the Philippines typically costs ₱180,000–₱280,000 installed.' },
        { iconName: 'Receipt', title: 'Earn Bill Credits', description: "Exported kWh are credited at your utility's blended generation rate. Homes with large daytime loads (offices, businesses) can achieve near-zero monthly bills." },
        { iconName: 'Timer', title: 'Fastest Payback', description: 'With no battery costs, on-grid systems can pay back in 3–5 years — the shortest ROI of any solar configuration at current Leyte electricity rates.' },
        { iconName: 'Wrench', title: 'Minimal Maintenance', description: 'No moving parts, no battery replacement, no electrolyte checks. Panels require only occasional cleaning; inverters are rated for 10–15 years of service.' },
        { iconName: 'Scale', title: 'Scalable Design', description: 'Start with a smaller system and add panels later. Batteries can be added at any time to upgrade to a hybrid setup as your needs or budget change.' },
        { iconName: 'Globe', title: 'Environmental Impact', description: 'A 5 kW system offsets approximately 3 tonnes of CO₂ per year — the equivalent of removing one car from the road annually.' },
      ]}
      useCases={[
        'Residential homes with stable grid supply and predictable daytime usage',
        'Offices and commercial buildings operating primarily during daylight hours',
        'Schools, churches, and community buildings with daytime-heavy loads',
        'Businesses looking for the fastest return on solar investment',
        'Properties where budget constraints make battery systems impractical',
      ]}
      specs={[
        { label: 'Typical System Size', value: '3 kW – 100 kW+' },
        { label: 'Inverter Type', value: 'Grid-Tie (no battery port)' },
        { label: 'Panel Type', value: 'Monocrystalline PERC / TOPCon' },
        { label: 'Net Metering Eligibility', value: 'Up to 100 kW under RA 9513' },
        { label: 'Credit Rate', value: 'Blended generation rate (utility-set)' },
        { label: 'Inverter Lifespan', value: '10–15 years' },
        { label: 'Panel Warranty', value: '25-year linear power output warranty' },
        { label: 'Grid Compliance', value: 'DOE/ERC-compliant anti-islanding protection' },
      ]}
      sources={[
        { title: 'Net Metering Rules and Regulations', url: 'https://www.erc.gov.ph', publisher: 'Energy Regulatory Commission (ERC) Philippines' },
        { title: 'Renewable Energy Act of 2008 (RA 9513)', url: 'https://www.doe.gov.ph', publisher: 'Department of Energy Philippines' },
        { title: 'Grid-Connected Photovoltaic Systems', url: 'https://www.irena.org', publisher: 'IRENA' },
        { title: 'Solar Photovoltaic System Basics', url: 'https://www.nrel.gov', publisher: 'NREL' },
      ]}
    />
  );
}