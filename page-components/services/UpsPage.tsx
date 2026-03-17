import ServicePageLayout from '@/components/ui/ServicePageLayout';
const bg4 = '/assets/bg-4.jpg';

export default function UpsPage() {
  return (
    <ServicePageLayout
      serviceId="ups"
      title="UPS Systems"
      tagline="Protect your equipment and keep critical operations running through every power interruption."
      heroBgImage={bg4}
      iconName="ShieldCheck"
      overview="An Uninterruptible Power Supply (UPS) provides instant battery backup when mains power fails or fluctuates. It protects sensitive electronics from voltage surges, brownouts, and blackouts — safeguarding computers, servers, medical devices, and industrial equipment from data loss, damage, and costly downtime."
      whatIsIt="A UPS is a device containing a battery (or battery bank), a rectifier/charger, and an inverter. It sits between the utility power supply and your connected loads. When grid power is normal, the UPS charges its battery while powering the connected load — in some topologies, through the inverter at all times (online/double-conversion), providing complete isolation from grid power quality issues. When power fails, the inverter seamlessly switches to battery power with zero to near-zero transfer time. UPS systems range from small desktop units (500 VA) to large three-phase industrial installations (hundreds of kVA). For solar hybrid users, a UPS complements the solar system by protecting loads during the brief inverter switching time and filtering power quality issues."
      howItWorks={[
        {
          step: 'Normal Operation',
          description: 'Grid AC powers the load. In offline/standby UPS: power flows directly through the unit. In online/double-conversion: all power is rectified to DC and re-inverted to clean AC, providing total isolation.',
        },
        {
          step: 'Battery Charging',
          description: 'An internal rectifier and charger keeps the battery bank fully charged at all times, ready for instant deployment.',
        },
        {
          step: 'Power Failure Response',
          description: "When mains power is interrupted, the UPS's internal inverter supplies battery power to connected loads. Offline UPS transfer time: 4–12 ms. Online UPS: 0 ms (no transfer at all).",
        },
        {
          step: 'Voltage Regulation',
          description: 'Many UPS models include AVR (Automatic Voltage Regulation), correcting brownouts and overvoltages without switching to battery — extending battery life and protecting equipment from power quality issues common in Philippine grids.',
        },
        {
          step: 'Load Shedding & Runtime',
          description: 'Runtime depends on battery capacity and connected load. A 1 kVA UPS with standard battery provides ~10–20 minutes for a PC. Extended battery modules can provide hours of runtime for critical loads.',
        },
      ]}
      benefits={[
        { iconName: 'Monitor', title: 'Equipment Protection', description: 'Prevents expensive damage to computers, servers, medical equipment, and industrial controllers caused by voltage spikes, surges, and unclean power.' },
        { iconName: 'Database', title: 'Data & Work Protection', description: 'Provides enough time to save work and perform a clean system shutdown during extended outages — preventing data corruption and hardware damage from abrupt power loss.' },
        { iconName: 'Activity', title: 'Business Continuity', description: 'For businesses, every minute of downtime has a cost. A UPS ensures operations continue through the brief, frequent brownouts common in Visayas.' },
        { iconName: 'Gauge', title: 'Power Quality Conditioning', description: 'Line-interactive and online UPS models regulate voltage continuously, correcting brownouts and overvoltages without battery cycling — crucial in areas with unstable grid voltage.' },
        { iconName: 'Wifi', title: 'Network & Internet Uptime', description: 'Keep your routers, switches, and fiber ONTs powered through outages for continuous internet and communication — critical for home offices and remote workers.' },
        { iconName: 'Zap', title: 'Solar System Complement', description: 'In a solar hybrid setup, a UPS covers the brief (<20 ms) switching window of the hybrid inverter during blackouts, providing completely seamless power for sensitive electronics.' },
      ]}
      useCases={[
        'Home offices and remote workers (PC, router, monitors)',
        'Medical clinics and pharmacies (refrigerators, diagnostic equipment)',
        'CCTV systems and security infrastructure',
        'Network server rooms and data centers',
        'POS systems and retail cash registers',
        'Industrial control panels and automation equipment',
      ]}
      specs={[
        { label: 'UPS Topologies', value: 'Offline/Standby, Line-Interactive, Online (Double-Conversion)' },
        { label: 'Capacity Range', value: '500 VA – 500 kVA' },
        { label: 'Transfer Time (Offline)', value: '4–12 milliseconds' },
        { label: 'Transfer Time (Online)', value: '0 milliseconds' },
        { label: 'Battery Type', value: 'VRLA AGM (standard), Lithium-Ion (premium)' },
        { label: 'Typical Runtime (1 kVA, full load)', value: '10–20 minutes (ext. battery: hours)' },
        { label: 'Efficiency (Online)', value: '94–97% (eco mode up to 99%)' },
        { label: 'Supported Brands', value: 'Voltronic Power, APC, Eaton, Mecer' },
      ]}
      sources={[
        { title: 'Uninterruptible Power Supplies — Technical Overview', url: 'https://www.iec.ch', publisher: 'International Electrotechnical Commission (IEC)' },
        { title: 'Power Quality and UPS Systems', url: 'https://www.nrel.gov', publisher: 'NREL' },
        { title: 'Voltronic Power UPS Technical Documentation', url: 'https://www.voltronicpower.com', publisher: 'Voltronic Power' },
        { title: 'Business Continuity and Power Protection', url: 'https://www.iea.org', publisher: 'IEA' },
      ]}
    />
  );
}