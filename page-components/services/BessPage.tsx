import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function BessPage() {
  return (
    <ServicePageLayout
      serviceId="bess"
      title="Battery Energy Storage (BESS)"
      tagline="Never lose power again — store solar energy and stay powered through any outage, day or night."
      heroBgImage={bg4}
      iconName="Battery"
      overview="A Battery Energy Storage System (BESS) stores electrical energy in lithium cells for use on demand. Paired with solar panels, a BESS lets you use free solar energy at night, ride through brownouts without interruption, and reduce dependence on the grid — making it the cornerstone of true energy independence."
      whatIsIt="A BESS is a rechargeable battery system combined with a battery management system (BMS) and bidirectional inverter/charger. In a solar context, the BESS charges during peak solar generation hours and discharges to power loads when solar is insufficient or unavailable. Modern BESS units use lithium iron phosphate (LFP) chemistry — the safest, longest-lasting lithium battery chemistry available — with cycle lives exceeding 4,000 charge-discharge cycles at 80% depth of discharge. In the Philippines, BESS installations are increasingly common in both residential and commercial settings due to the high frequency of grid interruptions, particularly in Visayas and Mindanao."
      howItWorks={[
        {
          step: 'Charging from Solar',
          description: 'The BESS charges when solar production exceeds immediate load demand. An MPPT charge controller or hybrid inverter manages the charge rate to protect battery health.',
        },
        {
          step: 'Battery Management System (BMS)',
          description: 'An embedded BMS monitors every cell in real time, balancing charge levels, preventing overcharge/deep discharge, and protecting against short circuits and temperature extremes.',
        },
        {
          step: 'Discharging to Loads',
          description: 'At night or during grid outages, the BESS supplies stored DC power through a bidirectional inverter, converting it to 230 V AC for your home or business.',
        },
        {
          step: 'Grid Charging (Optional)',
          description: 'When solar is insufficient, the BESS can charge from the grid during off-peak hours (typically overnight) at lower rates, then discharge during expensive peak periods — a strategy called time-of-use (TOU) optimization.',
        },
        {
          step: 'Seamless Transfer',
          description: 'During a blackout, a quality hybrid inverter switches to battery power in under 20 milliseconds — so fast that most electronics, routers, and computers never notice an interruption.',
        },
      ]}
      benefits={[
        { iconName: 'Zap', title: '24/7 Power Supply', description: 'Discharge stored solar energy through the night. A 10 kWh battery can power a typical Filipino household for 8–12 hours depending on load.' },
        { iconName: 'ShieldCheck', title: 'Brownout Immunity', description: 'Visayas experiences some of the highest grid interruption rates in the Philippines. BESS eliminates disruption to sensitive equipment, refrigeration, and business operations.' },
        { iconName: 'Clock', title: 'Time-of-Use Savings', description: 'Charge at night when rates are lowest; discharge during peak hours when rates are highest. Maximizes financial return even without heavy solar generation.' },
        { iconName: 'Leaf', title: 'Maximize Solar Self-Consumption', description: 'Without storage, excess midday solar is wasted or exported at low credit rates. BESS captures this energy for self-use, maximizing your return on the solar investment.' },
        { iconName: 'Flame', title: 'LFP Safety', description: 'Lithium iron phosphate (LFP) cells are thermally stable — they do not experience thermal runaway at the temperatures common in Philippine climates, unlike older NMC chemistries.' },
        { iconName: 'CalendarCheck', title: 'Long Lifespan', description: 'LFP batteries are warranted for 10 years and rated for over 4,000 full cycles — meaning daily cycling for over 10 years before reaching 80% residual capacity.' },
      ]}
      useCases={[
        'Homes and businesses in areas with frequent brownouts (Leyte, Samar, Cebu, Mindanao)',
        'Cold storage facilities and refrigeration-dependent businesses',
        'Hospitals, clinics, and medical facilities requiring uninterrupted power',
        'Data centers, server rooms, and telecommunications equipment',
        'Farms and agricultural operations with pumping and irrigation needs',
      ]}
      specs={[
        { label: 'Battery Chemistry', value: 'Lithium Iron Phosphate (LFP)' },
        { label: 'Typical Capacity', value: '5 kWh – 200 kWh+' },
        { label: 'Round-Trip Efficiency', value: '95–98%' },
        { label: 'Depth of Discharge (DoD)', value: 'Up to 90% usable' },
        { label: 'Cycle Life', value: '>4,000 cycles at 80% DoD' },
        { label: 'Warranty', value: '10 years or 4,000 cycles' },
        { label: 'Operating Temperature', value: '0°C – 55°C' },
        { label: 'Supported Brands', value: 'LVTOPSUN, Sunri, Sofar BTS' },
      ]}
      sources={[
        { title: 'Battery Storage Technology Basics', url: 'https://www.nrel.gov', publisher: 'NREL' },
        { title: 'Electricity Storage and Renewables', url: 'https://www.irena.org', publisher: 'IRENA' },
        { title: 'Global EV Outlook — Battery Technology', url: 'https://www.iea.org', publisher: 'International Energy Agency (IEA)' },
        { title: 'LFP Battery Technology Overview', url: 'https://www.sofarsolar.com', publisher: 'Sofar Solar' },
      ]}
    />
  );
}