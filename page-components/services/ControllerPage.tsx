import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function ControllerPage() {
  return (
    <ServicePageLayout
      serviceId="controller"
      title="Solar Charge Controllers"
      tagline="The intelligent regulator that protects your batteries and maximizes the energy harvested from your solar array."
      heroBgImage={bg4}
      iconName="SlidersHorizontal"
      overview="A solar charge controller is the critical device between your solar panels and battery bank. It regulates the voltage and current coming from the panels to safely charge the batteries, preventing overcharge and deep discharge — the two main causes of premature battery failure. Modern MPPT controllers also maximize energy harvest by up to 30% compared to older PWM technology."
      whatIsIt="A solar charge controller (SCC) sits in the DC circuit between the solar array and the battery bank. It has two primary functions: (1) preventing overcharge by reducing or stopping charge current when the battery reaches full charge, and (2) preventing reverse current flow from battery to panels at night. There are two main controller technologies: PWM (Pulse Width Modulation) — the older, simpler, less efficient technology; and MPPT (Maximum Power Point Tracking) — the modern standard that continuously adjusts its input voltage to extract the maximum available power from the solar array. MPPT controllers are particularly beneficial when panels operate at a higher voltage than the battery bank, allowing them to step down voltage while increasing current, improving harvest efficiency by 15–30%."
      howItWorks={[
        {
          step: 'Array Voltage Sensing',
          description: 'The MPPT controller continuously measures the voltage and current output of the solar array, mapping the power curve (I-V curve) to find the exact operating point with maximum power output.',
        },
        {
          step: 'Maximum Power Point Tracking',
          description: 'The controller adjusts its input impedance several times per second to stay at the maximum power point — even as sunlight intensity and panel temperature change throughout the day.',
        },
        {
          step: 'DC-DC Conversion',
          description: "The MPPT controller performs a DC-DC step-down (buck) conversion: it accepts higher panel voltage (e.g. 60–150 V) and outputs at the battery's required charge voltage (12 V / 24 V / 48 V), with the extra voltage converted to additional current.",
        },
        {
          step: 'Multi-Stage Battery Charging',
          description: 'The controller applies a multi-stage charging profile: Bulk (full current), Absorption (constant voltage, tapering current), and Float (trickle maintenance). This optimizes battery health and longevity.',
        },
        {
          step: 'Low-Voltage Disconnect (LVD)',
          description: 'When battery voltage drops below a set threshold, the LVD output disconnects loads automatically — preventing deep discharge, which is the leading cause of premature battery failure.',
        },
      ]}
      benefits={[
        { iconName: 'Battery', title: 'Battery Protection', description: 'Proper charge regulation doubles or triples battery lifespan by preventing overcharge and deep discharge — the two most damaging operating conditions.' },
        { iconName: 'TrendingUp', title: 'Up to 30% More Energy', description: 'MPPT tracking extracts 15–30% more energy from the same panel array compared to PWM controllers — particularly valuable in cloudy or partially shaded conditions.' },
        { iconName: 'Sliders', title: 'Flexible System Voltage', description: 'MPPT controllers allow high-voltage panel strings (series wiring) to charge lower-voltage battery banks — enabling longer cable runs with thinner wire, reducing installation cost.' },
        { iconName: 'Sun', title: 'All-Day Optimization', description: 'MPPT tracking adapts continuously as the sun angle, cloud cover, and panel temperature change — maximizing harvest from dawn to dusk, not just at peak noon output.' },
        { iconName: 'Smartphone', title: 'Monitoring & Diagnostics', description: 'Modern controllers include LCD displays and Bluetooth/RS485 connectivity for real-time monitoring of array power, battery voltage, state of charge, and historical data logging.' },
        { iconName: 'Wrench', title: 'Plug-and-Play Compatibility', description: 'Compatible with all battery types — lead-acid (flooded, AGM, gel) and lithium (LFP, lithium polymer) — with programmable charge parameters for optimal battery chemistry matching.' },
      ]}
      useCases={[
        'Off-grid solar systems for homes, farms, and remote installations',
        'Solar streetlights and outdoor lighting systems',
        'Telecommunications repeater stations and remote monitoring equipment',
        'Solar-powered boats, RVs, and mobile installations',
        'Small standalone systems: water pumps, sensors, security cameras',
        'Battery charging stations in remote barangays',
      ]}
      specs={[
        { label: 'Controller Types', value: 'MPPT (recommended), PWM' },
        { label: 'MPPT Efficiency', value: '>98% tracking efficiency' },
        { label: 'Current Range', value: '10 A – 100 A (MPPT), 5 A – 60 A (PWM)' },
        { label: 'System Voltages', value: '12 V / 24 V / 36 V / 48 V auto-select' },
        { label: 'Max PV Input Voltage', value: 'Up to 150 V (MPPT)' },
        { label: 'Battery Compatibility', value: 'Lead-Acid, AGM, Gel, LFP Lithium' },
        { label: 'Protection Features', value: 'Overcharge, deep discharge, reverse polarity, short circuit' },
        { label: 'Supported Brands', value: 'Victron Energy, EPSolar, Sofar, Renogy' },
      ]}
      sources={[
        { title: 'Photovoltaic Systems — Charge Controller Design', url: 'https://www.nrel.gov', publisher: 'NREL' },
        { title: 'MPPT Solar Charge Controller Technology', url: 'https://www.victronenergy.com', publisher: 'Victron Energy' },
        { title: 'Off-Grid Solar for Developing Nations', url: 'https://www.irena.org', publisher: 'IRENA' },
        { title: 'Solar Home Systems — Technical Standards', url: 'https://www.iea.org', publisher: 'IEA' },
      ]}
    />
  );
}