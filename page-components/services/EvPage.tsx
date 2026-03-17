import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function EvPage() {
  return (
    <ServicePageLayout
      serviceId="ev"
      title="EV Charger Installation"
      tagline="Charge your electric vehicle at home using clean solar energy — for almost nothing per kilometer."
      heroBgImage={bg4}
      iconName="Car"
      overview="With the rapid growth of electric vehicles (EVs) in the Philippines, having a dedicated home or business EV charging station is no longer a luxury — it is a practical necessity. When paired with solar panels, you can charge your vehicle with energy that costs a fraction of the grid rate, making every kilometer essentially free."
      whatIsIt="An EV charger (Electric Vehicle Supply Equipment or EVSE) is a device that safely delivers AC or DC power to an electric vehicle's onboard charger or battery pack. Home and commercial chargers are classified by level: Level 1 (standard 230 V outlet, slow), Level 2 (dedicated 7–22 kW AC charger, fast), and Level 3 (DC fast charger, 50–350 kW, commercial). JMC Solar PH specializes in Level 2 AC wall-box installations for homes and businesses — the sweet spot of cost, convenience, and charging speed. When combined with an existing solar system, an EV charger effectively turns your car's fuel cost into a near-zero solar-powered expense."
      howItWorks={[
        {
          step: 'Dedicated Circuit Installation',
          description: 'A licensed electrician installs a dedicated 32 A or 40 A circuit from your distribution board to the charger location — typically the garage or carport.',
        },
        {
          step: 'Wall-Box Charger Mounting',
          description: 'The EVSE unit is wall-mounted, weatherproofed (IP54+), and connected to the dedicated circuit. It includes safety features: ground fault protection, over-current protection, and thermal monitoring.',
        },
        {
          step: 'Vehicle Connection via J1772 or Type 2',
          description: "The charger supplies AC power through a standardized connector. The vehicle's onboard charger converts AC to DC for the battery pack. Communication between charger and vehicle manages safe charge limits.",
        },
        {
          step: 'Solar Integration (Optional)',
          description: 'When paired with a solar + BESS system, the EV charger can be configured to prioritize solar charging — charging your car only when solar excess is available, maximizing free energy use.',
        },
      ]}
      benefits={[
        { iconName: 'Zap', title: 'Fast Home Charging', description: 'A 7.4 kW Level 2 charger adds roughly 30–40 km of range per hour — a full overnight charge covers 200–350 km for most EVs on the market.' },
        { iconName: 'Banknote', title: 'Solar-Powered Driving', description: 'With solar panels, charging cost drops to ₱0 per km from solar, vs. ₱1.50–₱2.50 per km from the grid and ₱4–₱7 per km from petrol.' },
        { iconName: 'Shield', title: 'Safe & Standards-Compliant', description: 'Proper EVSE installation prevents the risks of using standard outlets (overheating, fire). All installations comply with the Philippine Electrical Code (PEC) and IEC 61851.' },
        { iconName: 'Smartphone', title: 'Smart Charging Controls', description: 'Schedule charging for off-peak hours or solar surplus periods via mobile app. Monitor energy used, cost savings, and charging history.' },
        { iconName: 'Building2', title: 'Property Value', description: 'EV charging capability is increasingly a key selling point for residential and commercial properties as EV adoption accelerates in the Philippines.' },
        { iconName: 'Globe', title: 'Zero Local Emissions', description: "EV + solar = zero tailpipe emissions and zero carbon charging. Contribute directly to the Philippines' NDC targets and clean air goals." },
      ]}
      useCases={[
        'Homeowners with EVs (BYD, Nissan Leaf, MG ZS EV, etc.) wanting convenient home charging',
        'Businesses providing charging amenities for customers or employees',
        'Hotels, resorts, and commercial establishments attracting EV-driving guests',
        'Fleet operators (delivery vans, company cars) centralizing overnight charging',
        'Solar system owners wanting to maximize self-consumption through EV charging',
      ]}
      specs={[
        { label: 'Charger Level', value: 'Level 2 AC (standard home/commercial)' },
        { label: 'Output Power', value: '7.4 kW (32 A) – 22 kW (32 A, 3-phase)' },
        { label: 'Connector Standard', value: 'IEC 62196 Type 2 / J1772 Type 1' },
        { label: 'Charging Speed', value: '~30–120 km of range per hour' },
        { label: 'Protection Rating', value: 'IP54 minimum (outdoor rated)' },
        { label: 'Electrical Requirement', value: 'Dedicated 32 A – 40 A circuit' },
        { label: 'Smart Features', value: 'App control, scheduling, solar integration' },
        { label: 'Standards Compliance', value: 'IEC 61851, Philippine Electrical Code' },
      ]}
      sources={[
        { title: 'Global EV Outlook 2024', url: 'https://www.iea.org', publisher: 'IEA' },
        { title: 'Electric Vehicle Charging Infrastructure', url: 'https://www.nrel.gov', publisher: 'NREL' },
        { title: 'EV Adoption in Southeast Asia', url: 'https://www.irena.org', publisher: 'IRENA' },
        { title: 'Electric Vehicle Industry Development Act (RA 11697)', url: 'https://www.doe.gov.ph', publisher: 'DOE Philippines' },
      ]}
    />
  );
}