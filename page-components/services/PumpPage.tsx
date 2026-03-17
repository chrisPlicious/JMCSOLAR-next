import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function PumpPage() {
  return (
    <ServicePageLayout
      serviceId="pump"
      title="Solar Pumping Systems"
      tagline="Power your irrigation and water supply with the sun — zero fuel, zero electricity bill."
      heroBgImage={bg4}
      iconName="Droplets"
      overview="Solar pumping systems use photovoltaic panels to power water pumps for irrigation, livestock watering, domestic supply, and fish pond management — eliminating diesel or electricity costs entirely. They are ideal for farms and remote properties in Eastern Visayas where fuel prices and grid unreliability make traditional pumping expensive."
      whatIsIt="A solar pumping system consists of a solar array, a solar pump controller (also called a VFD or MPPT pump drive), and a water pump (submersible, surface, or centrifugal). The controller converts solar DC power to variable-frequency AC to drive the pump motor, adjusting pump speed in real time based on available sunlight. No batteries are required — the pump simply runs whenever there is sufficient sun, storing energy in the form of water in a tank or pond. For overnight or cloudy-day operation, a small battery bank or grid backup can be added. These systems are promoted by the FAO and World Bank as a cost-effective solution for smallholder farmers in developing nations."
      howItWorks={[
        {
          step: 'Solar Panel Array',
          description: "Panels are sized to the pump motor's power rating. A 1 kW submersible pump typically needs 1.5–2 kWp of panels to account for losses and operate under partial cloud.",
        },
        {
          step: 'MPPT Pump Controller',
          description: 'The controller tracks the maximum power point of the solar array and converts it to the right voltage and frequency for the pump motor. It also provides dry-run protection and fault monitoring.',
        },
        {
          step: 'Water Pumping',
          description: 'The pump lifts water from a well, river, or pond. Submersible pumps are used for deep wells (10–100 m+); surface pumps for shallow sources. Flow rate depends on pump size and solar availability.',
        },
        {
          step: 'Storage Tank Buffering',
          description: 'Water is pumped during daylight into an elevated tank or reservoir, providing gravity-fed supply throughout the day and night without batteries.',
        },
      ]}
      benefits={[
        { iconName: 'Fuel', title: 'Zero Fuel Cost', description: 'Diesel pump operators in Eastern Visayas spend ₱500–₱2,000 per day on fuel. Solar pumping eliminates this cost entirely — the sun is free.' },
        { iconName: 'Leaf', title: 'Eco-Friendly Irrigation', description: 'No emissions, no noise, no diesel spills. Solar pumps protect the surrounding soil and water table from fuel contamination.' },
        { iconName: 'Wrench', title: 'Low Maintenance', description: 'Solar pump systems have fewer moving parts than diesel engines. With no combustion components, service intervals are minimal — typically an annual inspection.' },
        { iconName: 'MapPin', title: 'Works Anywhere', description: 'No grid connection required. Ideal for farms, highlands, and coastal areas in Leyte, Samar, and surrounding islands where grid access is limited or unreliable.' },
        { iconName: 'Sprout', title: 'Supports Food Security', description: 'Reliable, affordable irrigation enables year-round cropping instead of rain-fed farming — directly increasing harvest yields and farm income.' },
        { iconName: 'Banknote', title: 'Fast Payback', description: 'At ₱1,000/day in diesel savings, a ₱150,000 solar pump system pays back in under 6 months for continuous-use agricultural applications.' },
      ]}
      useCases={[
        'Rice and vegetable irrigation in Leyte, Samar, and surrounding islands',
        'Coconut plantation irrigation and fertilizer injection',
        'Livestock and poultry farm water supply',
        'Fishpond water circulation and oxygenation',
        'Domestic water supply for remote barangays without grid power',
        'Community water systems and Level II water supply projects',
      ]}
      specs={[
        { label: 'Pump Types', value: 'Submersible, Surface, Centrifugal' },
        { label: 'Motor Power Range', value: '0.37 kW – 22 kW+' },
        { label: 'Max Head (Submersible)', value: 'Up to 200 m' },
        { label: 'Flow Rate', value: '1 m³/hr – 100 m³/hr depending on size' },
        { label: 'Controller Type', value: 'MPPT Variable Frequency Drive (VFD)' },
        { label: 'Panel Requirement', value: '~1.5× pump motor rated power' },
        { label: 'Battery Optional', value: 'Yes — for cloudy/night operation' },
        { label: 'Supported Brands', value: 'Lorentz, Franklin, Grundfos solar series' },
      ]}
      sources={[
        { title: 'Solar Powered Irrigation Systems', url: 'https://www.fao.org', publisher: 'Food and Agriculture Organization (FAO)' },
        { title: 'Solar Water Pumping for Agriculture', url: 'https://www.worldbank.org', publisher: 'World Bank' },
        { title: 'Solar Pumping Fundamentals', url: 'https://www.irena.org', publisher: 'IRENA' },
        { title: 'Philippine Solar Irrigation Program', url: 'https://www.da.gov.ph', publisher: 'Department of Agriculture Philippines' },
      ]}
    />
  );
}