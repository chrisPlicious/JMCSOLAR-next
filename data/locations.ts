export type LocationTier = 'municipality' | 'province';

export interface ServiceLocation {
  slug: string;
  name: string;
  tier: LocationTier;
  province?: string;
  region: string;
  geo: { lat: number; lng: number };
  isPrimary?: boolean;
  childSlugs?: string[];
  nearbyAreas?: string[];
  intro: string;
  whyJmc: string[];
  faqs: { q: string; a: string }[];
}

export const LOCATIONS: ServiceLocation[] = [
  // ===== MUNICIPALITIES — LEYTE =====
  {
    slug: 'ormoc-city',
    name: 'Ormoc City',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 11.0164, lng: 124.6060 },
    isPrimary: true,
    nearbyAreas: ['Cogon', 'Sabang Beach', 'Linao', 'Lao', 'Ipil', 'Cabulihan', 'Bagong Buhay', 'Tigbao', 'District 1', 'District 2', 'District 3'],
    intro:
      'JMC Solar PH is headquartered in Ormoc City, making us the go-to solar installer for homes and businesses throughout Leyte\'s fastest-growing city. Our team has completed residential, commercial, and industrial solar installations across every district of Ormoc — from Cogon to the outskirts. As a locally based company, we offer same-day site assessments and ongoing after-sales support.',
    whyJmc: [
      'Head office in Cogon, Ormoc City — fastest response times in the area',
      'All installations led by a licensed electrical engineer',
      'Completed 9+ projects in Ormoc and surrounding municipalities',
      'DOE-compliant systems with net metering support for LEYECO customers',
    ],
    faqs: [
      {
        q: 'How much does a solar panel installation cost in Ormoc City?',
        a: 'Residential solar systems in Ormoc City typically range from ₱150,000 to ₱600,000+ depending on system size. We offer free site assessments and custom quotes.',
      },
      {
        q: 'Can I apply for net metering with LEYECO in Ormoc?',
        a: 'Yes. JMC Solar PH handles the complete net metering application process with LEYECO for qualifying on-grid and hybrid systems in Ormoc City.',
      },
      {
        q: 'How long does a solar installation take in Ormoc City?',
        a: 'Most residential installations in Ormoc City are completed within 1–3 days. Commercial and industrial systems may take longer depending on size and site conditions.',
      },
      {
        q: 'Do you service areas outside Ormoc City in Leyte?',
        a: 'Yes. Our service area covers all of Leyte and Southern Leyte, including Tacloban, Baybay, Maasin, and surrounding municipalities.',
      },
      {
        q: 'Is solar worth it in Ormoc City given the weather?',
        a: 'Absolutely. Ormoc City and Leyte receive 4.5–5.5 peak sun hours daily on average. Hybrid systems with battery storage also protect against typhoon-related outages.',
      },
    ],
  },
  {
    slug: 'tacloban-city',
    name: 'Tacloban City',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 11.2433, lng: 125.0036 },
    nearbyAreas: ['Abucay', 'Apitong', 'Bagacay', 'Caibaan', 'Downtown Tacloban', 'San Jose', 'Libertad', 'Marasbaras', 'Sagkahan'],
    intro:
      'Tacloban City, the regional center of Eastern Visayas, is one of JMC Solar PH\'s primary expansion areas. We bring licensed solar installation services to homes, government offices, and commercial establishments across Tacloban. Our proximity in Ormoc City means fast mobilization and reliable after-sales support for all Tacloban clients.',
    whyJmc: [
      'Serving Tacloban\'s growing residential and commercial solar demand',
      'All systems designed by a licensed electrical engineer — ENERCON and DOE compliant',
      'Net metering application assistance for LEYTE II ELECTRIC COOPERATIVE customers',
      'Proven track record across Eastern Visayas with hybrid, on-grid, and BESS systems',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH install solar panels in Tacloban City?',
        a: 'Yes. JMC Solar PH provides full solar installation services in Tacloban City, including residential, commercial, and industrial systems.',
      },
      {
        q: 'What solar system is best for a home in Tacloban?',
        a: 'Given Tacloban\'s exposure to power interruptions during typhoons, we recommend a hybrid solar system with battery storage to ensure 24/7 power security.',
      },
      {
        q: 'How do I apply for net metering in Tacloban?',
        a: 'JMC Solar PH handles net metering applications for qualifying grid-tied systems in Tacloban City. We coordinate directly with your distribution utility.',
      },
      {
        q: 'How fast can you deploy in Tacloban City?',
        a: 'We can typically schedule a site assessment in Tacloban within 2–5 business days and complete installation within 1–2 weeks after system design approval.',
      },
    ],
  },
  {
    slug: 'baybay-city',
    name: 'Baybay City',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.6789, lng: 124.8011 },
    nearbyAreas: ['Downtown Baybay', 'Cogon', 'Gapas', 'Libertad', 'Pinagdait', 'Visca', 'VSU Campus Area'],
    intro:
      'Baybay City is a key service area for JMC Solar PH along the western coast of Leyte. From residential installations near VisCA to commercial projects in the downtown area, we provide complete solar energy solutions tailored to Baybay\'s grid conditions and growing energy needs.',
    whyJmc: [
      'Experienced with Baybay\'s grid infrastructure and LEYECO zone requirements',
      'Full-service solar: assessment, design, installation, and net metering filing',
      'Hybrid solar systems ideal for Baybay\'s coastal weather patterns',
      'Post-installation maintenance and monitoring support',
    ],
    faqs: [
      {
        q: 'Is solar installation available in Baybay City, Leyte?',
        a: 'Yes. JMC Solar PH provides solar installation services throughout Baybay City, including residential and commercial properties.',
      },
      {
        q: 'What type of solar system is best for coastal areas like Baybay?',
        a: 'We recommend corrosion-resistant mounting systems and hybrid setups with battery backup for coastal locations in Baybay, protecting against salt air and power interruptions.',
      },
      {
        q: 'Can I get net metering in Baybay City?',
        a: 'Yes, qualifying on-grid and hybrid installations in Baybay City are eligible for net metering. JMC Solar PH handles the full application process.',
      },
      {
        q: 'How long does installation take in Baybay City?',
        a: 'Most residential installations in Baybay City are completed in 1–3 days after system design is finalized.',
      },
    ],
  },
  {
    slug: 'inopacan',
    name: 'Inopacan',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.5050, lng: 124.7461 },
    nearbyAreas: ['Poblacion Inopacan', 'Casili-on', 'Lugna', 'Can-apa', 'Mahayahay'],
    intro:
      'JMC Solar PH serves Inopacan and its surrounding barangays with professional solar panel installations designed for the municipality\'s energy landscape. Whether for a home, farm, or small business, our systems help Inopacan residents reduce electricity costs and gain energy independence.',
    whyJmc: [
      'Solar pumping systems ideal for Inopacan\'s agricultural properties',
      'Off-grid and hybrid systems available for areas with unstable grid supply',
      'Licensed electrical engineer oversees every installation',
      'Affordable financing options available',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH serve Inopacan, Leyte?',
        a: 'Yes. Inopacan is within our service coverage in Leyte. We offer site assessments and full solar installation services.',
      },
      {
        q: 'Are solar pumping systems available in Inopacan?',
        a: 'Yes. We install solar pumping systems suitable for farms, fishponds, and rural properties in Inopacan.',
      },
      {
        q: 'What if the power grid in my barangay is unreliable?',
        a: 'We offer off-grid and hybrid solar systems with battery storage that work independently of the grid — ideal for rural barangays with unreliable supply.',
      },
    ],
  },
  {
    slug: 'hindang',
    name: 'Hindang',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.4467, lng: 124.7333 },
    nearbyAreas: ['Poblacion Hindang', 'Cagnocot', 'Idao', 'Mahayahay', 'San Vicente'],
    intro:
      'Hindang, Leyte is part of JMC Solar PH\'s growing service network along Leyte\'s western coast. We bring professional solar installation services to residential and agricultural properties throughout the municipality, helping Hindang residents cut electricity bills and embrace clean energy.',
    whyJmc: [
      'Serving southern Leyte coast municipalities including Hindang',
      'Agricultural solar — pumping and farm power solutions available',
      'Hybrid and off-grid systems for areas with limited grid reliability',
      'Free site assessment for all Hindang inquiries',
    ],
    faqs: [
      {
        q: 'Can JMC Solar PH install solar in Hindang, Leyte?',
        a: 'Yes. Hindang is within our Leyte service area. Contact us to schedule a free site assessment.',
      },
      {
        q: 'What solar options work best for farms in Hindang?',
        a: 'Solar pumping systems and off-grid setups work well for agricultural properties in Hindang. We customize each system to your water and power needs.',
      },
      {
        q: 'How much can I save on electricity in Hindang with solar?',
        a: 'Depending on your current consumption and system size, most clients reduce their electricity bill by 60–100% with a properly sized solar system.',
      },
    ],
  },
  {
    slug: 'hilongos',
    name: 'Hilongos',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.3789, lng: 124.7556 },
    nearbyAreas: ['Poblacion Hilongos', 'Mahayag', 'Plaridel', 'San Roque', 'Togbongon', 'Bojo'],
    intro:
      'Hilongos is a key gateway municipality in southern Leyte, and JMC Solar PH is proud to serve its residents and businesses with professional solar energy solutions. Our team installs residential, commercial, and agricultural solar systems throughout Hilongos and nearby barangays.',
    whyJmc: [
      'Full solar services in Hilongos — residential, commercial, and agricultural',
      'Net metering assistance for eligible systems',
      'All installations supervised by a licensed electrical engineer',
      'Post-installation support and maintenance',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH install solar panels in Hilongos, Leyte?',
        a: 'Yes. We serve Hilongos and surrounding barangays with complete solar installation services.',
      },
      {
        q: 'Is net metering available in Hilongos?',
        a: 'Net metering eligibility depends on your distribution utility. JMC Solar PH can advise and handle the application for qualifying systems.',
      },
      {
        q: 'How do I get a solar quote in Hilongos?',
        a: 'Contact us via phone, email, or the inquiry form on this page. We\'ll schedule a free site assessment at your Hilongos property.',
      },
    ],
  },
  {
    slug: 'bato',
    name: 'Bato',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.3000, lng: 124.7833 },
    nearbyAreas: ['Poblacion Bato', 'San Isidro', 'Tinambacan', 'Cagba-ac', 'Plaridel'],
    intro:
      'Bato, Leyte is among the municipalities served by JMC Solar PH as part of our comprehensive Leyte coverage. We install solar panel systems for homes, businesses, and farms in Bato, helping the community reduce energy costs and contribute to a cleaner environment.',
    whyJmc: [
      'Part of JMC\'s full Leyte service network',
      'Agricultural and residential solar solutions available',
      'Off-grid systems for barangays with limited grid access',
      'Licensed, insured, and DOE-compliant installations',
    ],
    faqs: [
      {
        q: 'Can I get solar installation in Bato, Leyte?',
        a: 'Yes. Bato is covered under JMC Solar PH\'s Leyte service area. We can conduct a free site assessment at your property.',
      },
      {
        q: 'Are off-grid systems available in Bato?',
        a: 'Yes. For properties in Bato with unreliable or no grid connection, we offer complete off-grid solar solutions with battery storage.',
      },
      {
        q: 'What is the process for getting solar in Bato?',
        a: 'Reach out via our inquiry form. We\'ll visit your site, assess your energy needs, design a system, and provide a full quotation at no cost.',
      },
    ],
  },
  {
    slug: 'matalom',
    name: 'Matalom',
    tier: 'municipality',
    province: 'Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.2333, lng: 124.7833 },
    nearbyAreas: ['Poblacion Matalom', 'Bulak', 'Canduhao', 'San Antonio', 'Bilibol'],
    intro:
      'Matalom, located in the southern tip of Leyte province, is part of JMC Solar PH\'s expanding service network. We provide professional solar installations for residential and agricultural properties throughout the municipality, helping Matalom residents achieve energy independence.',
    whyJmc: [
      'Serving southernmost Leyte municipalities including Matalom',
      'Solar pumping systems for agricultural and irrigation use',
      'Hybrid and off-grid options for remote barangays',
      'Transparent pricing with free site assessment',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH service Matalom, Leyte?',
        a: 'Yes. Matalom is within our Leyte service coverage. Contact us to inquire about solar installation for your property.',
      },
      {
        q: 'What solar systems are best for farms in Matalom?',
        a: 'Solar water pumping and off-grid hybrid systems are well-suited for agricultural properties in Matalom. We design systems around your specific crop and irrigation requirements.',
      },
      {
        q: 'How long does it take to get solar installed in Matalom?',
        a: 'After a site assessment and system design approval, most residential installations in Matalom take 1–3 days to complete.',
      },
    ],
  },

  // ===== MUNICIPALITIES — SOUTHERN LEYTE =====
  {
    slug: 'maasin-city',
    name: 'Maasin City',
    tier: 'municipality',
    province: 'Southern Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.1336, lng: 124.8444 },
    nearbyAreas: ['Poblacion Maasin', 'Ibarra', 'Mantahan', 'Tomas Oppus', 'Abgao', 'Bato', 'Lanao'],
    intro:
      'Maasin City is the capital of Southern Leyte and a growing hub for solar energy adoption in the region. JMC Solar PH brings professional solar installation services to Maasin\'s homes, businesses, and government facilities. Our team is experienced with Southern Leyte\'s grid infrastructure and energy requirements.',
    whyJmc: [
      'Primary solar installer serving Southern Leyte\'s capital city',
      'Net metering application support for SOLECO-connected properties',
      'Hybrid solar with battery backup — ideal for Maasin\'s typhoon-prone climate',
      'Licensed electrical engineer on all projects',
    ],
    faqs: [
      {
        q: 'Is solar installation available in Maasin City, Southern Leyte?',
        a: 'Yes. JMC Solar PH serves Maasin City and the wider Southern Leyte area with full solar installation services.',
      },
      {
        q: 'Can I apply for net metering in Maasin City?',
        a: 'Yes. Qualifying systems in Maasin City can apply for net metering with Southern Leyte Electric Cooperative (SOLECO). We handle the application process.',
      },
      {
        q: 'What solar system is best for Maasin City homes?',
        a: 'We recommend hybrid solar systems with battery storage for Maasin City, given the region\'s vulnerability to typhoons and power interruptions.',
      },
      {
        q: 'How do I get a free solar assessment in Maasin?',
        a: 'Use our inquiry form or call us at 0917 508 8220. We\'ll schedule a site visit to your Maasin property and provide a detailed proposal.',
      },
      {
        q: 'Do you install commercial solar in Maasin City?',
        a: 'Yes. We install commercial and industrial solar systems in Maasin City, including rooftop solar for offices, retail establishments, and government buildings.',
      },
    ],
  },
  {
    slug: 'macrohon',
    name: 'Macrohon',
    tier: 'municipality',
    province: 'Southern Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.0833, lng: 125.1000 },
    nearbyAreas: ['Poblacion Macrohon', 'San Pedro', 'Hinay', 'San Juan', 'Mahayag'],
    intro:
      'Macrohon is a coastal municipality in Southern Leyte where JMC Solar PH provides solar installation services for residential and agricultural properties. Our systems are designed for Southern Leyte\'s coastal conditions — built to withstand salt air and typhoon-force winds.',
    whyJmc: [
      'Coastal-grade mounting systems resistant to salt air and strong winds',
      'Agricultural solar solutions for Macrohon\'s farming communities',
      'Off-grid and hybrid options for barangays with limited grid stability',
      'Free site assessment with no obligation',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH serve Macrohon, Southern Leyte?',
        a: 'Yes. We provide solar installation services in Macrohon as part of our Southern Leyte coverage.',
      },
      {
        q: 'Are solar systems in Macrohon suitable for the coastal climate?',
        a: 'Yes. We use mounting hardware and panel brands rated for coastal environments, ensuring long-term performance despite salt air and humidity.',
      },
      {
        q: 'What is the payback period for solar in Macrohon?',
        a: 'For most residential and commercial properties in Southern Leyte, the payback period is 4–7 years depending on system size and electricity consumption.',
      },
    ],
  },
  {
    slug: 'sogod',
    name: 'Sogod',
    tier: 'municipality',
    province: 'Southern Leyte',
    region: 'Eastern Visayas',
    geo: { lat: 10.3833, lng: 124.9833 },
    nearbyAreas: ['Poblacion Sogod', 'Hinunangon', 'Tabok', 'Libtong', 'Triana', 'Bagacay'],
    intro:
      'Sogod is a rapidly developing municipality in Southern Leyte and an active area of solar energy adoption. JMC Solar PH installs residential and commercial solar systems in Sogod and surrounding barangays, helping households and businesses reduce their electricity costs significantly.',
    whyJmc: [
      'Growing client base in Sogod and surrounding Southern Leyte municipalities',
      'Hybrid and on-grid solar systems tailored to SOLECO grid conditions',
      'Net metering assistance for qualified Sogod properties',
      'Transparent quotations with no hidden fees',
    ],
    faqs: [
      {
        q: 'Can I get solar installed in Sogod, Southern Leyte?',
        a: 'Yes. JMC Solar PH serves Sogod as part of our Southern Leyte service area.',
      },
      {
        q: 'What solar incentives are available in Sogod?',
        a: 'The Philippine government offers net metering (sell excess power back to the grid) and tax incentives for renewable energy systems. JMC Solar PH guides you through the process.',
      },
      {
        q: 'How much electricity can solar save me in Sogod?',
        a: 'A properly sized system can offset 60–100% of your electricity bill. We provide a detailed savings estimate during your free site assessment.',
      },
      {
        q: 'Do you offer installment payment for solar in Sogod?',
        a: 'Yes. JMC Solar PH offers financing and installment options to make solar accessible for Sogod residents and businesses.',
      },
    ],
  },

  // ===== MUNICIPALITIES / CITIES — CEBU =====
  {
    slug: 'cebu-city',
    name: 'Cebu City',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.3157, lng: 123.8854 },
    nearbyAreas: ['Lahug', 'Mabolo', 'Banilad', 'IT Park', 'Basak', 'Capitol Site', 'Sudlon', 'Talamban', 'Apas', 'Guadalupe', 'Punta Princesa'],
    intro:
      'Cebu City is one of JMC Solar PH\'s key expansion markets in Central Visayas. We install residential and commercial solar systems throughout Metro Cebu, from high-density subdivisions in Banilad and Lahug to commercial establishments along major thoroughfares. Our licensed team brings Eastern Visayas expertise to Cebu\'s booming solar market.',
    whyJmc: [
      'Serving Cebu City\'s residential subdivisions, condos, and commercial buildings',
      'Licensed electrical engineers with VECO grid knowledge',
      'Net metering application handling for Visayas Electric Co. (VECO) customers',
      'Hybrid, on-grid, and BESS systems for every property type',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH install solar in Cebu City?',
        a: 'Yes. JMC Solar PH serves Cebu City with full solar installation services for residential, commercial, and industrial clients.',
      },
      {
        q: 'Can I apply for net metering with VECO in Cebu City?',
        a: 'Yes. Qualifying grid-tied systems in Cebu City are eligible for VECO net metering. We handle the complete application and coordination.',
      },
      {
        q: 'What solar system is best for a house in Cebu City?',
        a: 'For most Cebu City homes, a hybrid solar system (3–10 kWp) with battery backup provides the best combination of savings and power security.',
      },
      {
        q: 'How much does solar installation cost in Cebu City?',
        a: 'Residential systems in Cebu City typically range from ₱180,000 to ₱700,000+ depending on size. We provide free, no-obligation site assessments and quotes.',
      },
      {
        q: 'Do you install solar for condos or townhouses in Cebu City?',
        a: 'Yes, with HOA and building management approval. We assess rooftop feasibility and design systems compliant with building requirements.',
      },
    ],
  },
  {
    slug: 'mandaue-city',
    name: 'Mandaue City',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.3236, lng: 123.9223 },
    nearbyAreas: ['Centro Mandaue', 'Cambaro', 'Guizo', 'Basak', 'Alang-Alang', 'Jagobiao', 'Paknaan', 'Ibabao-Estancia'],
    intro:
      'Mandaue City, home to many of Cebu\'s industrial parks and commercial zones, is a prime market for commercial and industrial solar installations. JMC Solar PH designs and installs large-scale solar systems for Mandaue factories, warehouses, and office complexes, as well as residential systems in its growing subdivisions.',
    whyJmc: [
      'Industrial and commercial solar expertise for Mandaue\'s business parks',
      'High-capacity systems (50 kWp+) designed for manufacturing and warehousing',
      'Net metering and RECo coordination for MECO-serviced properties',
      'Residential solar for Mandaue\'s expanding subdivisions and townhouses',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH serve Mandaue City, Cebu?',
        a: 'Yes. We provide solar installation services in Mandaue City for residential, commercial, and industrial clients.',
      },
      {
        q: 'What solar system size is right for a factory in Mandaue?',
        a: 'Commercial and industrial facilities in Mandaue typically require 50–500 kWp systems. We conduct a full energy audit and design a custom solution.',
      },
      {
        q: 'Can a business in Mandaue apply for net metering?',
        a: 'Yes. Businesses in Mandaue City with qualifying grid-tied solar systems can apply for net metering. JMC Solar PH manages the entire process.',
      },
      {
        q: 'How long does a commercial solar installation take in Mandaue?',
        a: 'Depending on system size, commercial installations in Mandaue typically take 3–10 business days.',
      },
    ],
  },
  {
    // Slug disambiguates from Talisay City, Negros Occidental
    slug: 'talisay-cebu',
    name: 'Talisay City',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.2447, lng: 123.8494 },
    nearbyAreas: ['Poblacion Talisay', 'Biasong', 'Bulacao', 'Cansojong', 'Dumlog', 'Lagtang', 'San Isidro', 'Tangke', 'Tabunok'],
    intro:
      'Talisay City in Cebu is a rapidly growing residential hub directly south of Cebu City. JMC Solar PH installs solar energy systems across Talisay\'s expanding subdivisions and commercial areas, helping residents and business owners reduce electricity costs amid rising power rates in the Visayas grid.',
    whyJmc: [
      'Serving Talisay City\'s rapidly growing residential subdivisions',
      'Expert knowledge of Visayas grid and VECO requirements',
      'Hybrid solar with battery backup for power security',
      'Quick deployment — most residential jobs completed in 1–3 days',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH install solar in Talisay City, Cebu?',
        a: 'Yes. We serve Talisay City (Cebu) with complete solar installation services.',
      },
      {
        q: 'What is the best solar system for a house in Talisay?',
        a: 'A 5–8 kWp hybrid system is ideal for most Talisay City households, providing significant bill reduction and battery backup for outages.',
      },
      {
        q: 'Can I get net metering in Talisay City, Cebu?',
        a: 'Yes. Eligible grid-tied systems in Talisay City can be registered for net metering. JMC Solar PH handles the full application.',
      },
      {
        q: 'How do I contact JMC Solar PH for a Talisay City quote?',
        a: 'Use the inquiry form on this page or call 0917 508 8220. We\'ll arrange a free site assessment at your Talisay City property.',
      },
    ],
  },
  {
    slug: 'liloan',
    name: 'Liloan',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.4000, lng: 123.9989 },
    nearbyAreas: ['Poblacion Liloan', 'Catarman', 'Cabadiangan', 'Jubay', 'Tayud', 'San Vicente', 'Yati'],
    intro:
      'Liloan is one of Cebu\'s fastest-growing municipalities in the north, with booming residential developments and commercial activity. JMC Solar PH brings professional solar installation to Liloan homeowners and businesses looking to offset the rising cost of electricity in the Visayas region.',
    whyJmc: [
      'Solar solutions for Liloan\'s growing residential communities',
      'On-grid and hybrid systems with net metering support',
      'All work by licensed electrical engineers',
      'Competitive pricing with transparent quotations',
    ],
    faqs: [
      {
        q: 'Is solar installation available in Liloan, Cebu?',
        a: 'Yes. JMC Solar PH serves Liloan, Cebu with full solar energy installation services.',
      },
      {
        q: 'What solar options are available for homes in Liloan?',
        a: 'We offer on-grid, hybrid, and off-grid solar systems for residential properties in Liloan. Hybrid systems are most popular for their combination of savings and backup power.',
      },
      {
        q: 'How do I get a solar quote for my Liloan property?',
        a: 'Fill out the inquiry form or call 0917 508 8220. We\'ll schedule a free site visit to your Liloan home or business.',
      },
    ],
  },
  {
    slug: 'consolacion',
    name: 'Consolacion',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.3764, lng: 123.9614 },
    nearbyAreas: ['Poblacion Consolacion', 'Danglog', 'Garing', 'Lamac', 'Pili', 'Pulgo', 'Sacsac', 'Tayud'],
    intro:
      'Consolacion is a thriving municipality north of Cebu City known for its residential developments and commercial activity. JMC Solar PH provides solar installation services for homes and businesses throughout Consolacion, helping clients achieve significant savings on their monthly electricity bills.',
    whyJmc: [
      'Residential solar expertise for Consolacion\'s subdivision communities',
      'VECO net metering application support',
      'Hybrid and on-grid systems sized for Consolacion\'s energy profile',
      'Fast site assessment and turnaround',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH install solar in Consolacion, Cebu?',
        a: 'Yes. We serve Consolacion, Cebu with complete solar installation services for residential and commercial properties.',
      },
      {
        q: 'What is the average cost of solar in Consolacion?',
        a: 'Residential solar in Consolacion typically ranges from ₱150,000 to ₱600,000+ depending on system size. Contact us for a free, customized quote.',
      },
      {
        q: 'Can I reduce my VECO bill with solar in Consolacion?',
        a: 'Yes. A properly sized solar system in Consolacion can reduce your monthly VECO bill by 60–100%, with net metering allowing you to earn credits for excess generation.',
      },
    ],
  },
  {
    slug: 'danao-city',
    name: 'Danao City',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.5208, lng: 124.0272 },
    nearbyAreas: ['Poblacion Danao', 'Dunggoan', 'Guinacot', 'Lawaan', 'Looc', 'Pajo', 'Taboc', 'Sandayong Norte'],
    intro:
      'Danao City in northern Cebu is a growing industrial and residential center served by JMC Solar PH. We install solar panel systems for Danao households, businesses, and industrial facilities, delivering clean energy solutions that reduce dependence on the Visayas grid.',
    whyJmc: [
      'Industrial and residential solar for Danao City\'s diverse property types',
      'Net metering coordination for DANECO and VECO customers',
      'Durable systems built for northern Cebu\'s weather conditions',
      'Post-installation monitoring and maintenance support',
    ],
    faqs: [
      {
        q: 'Is solar installation available in Danao City, Cebu?',
        a: 'Yes. JMC Solar PH provides solar installation services in Danao City for homes, businesses, and industrial facilities.',
      },
      {
        q: 'What is the solar potential in Danao City?',
        a: 'Danao City and northern Cebu receive excellent solar irradiation with 4.5–5.5 peak sun hours per day, making solar installations highly productive year-round.',
      },
      {
        q: 'How do I start the solar process in Danao City?',
        a: 'Contact us via the form on this page or call 0917 508 8220. We\'ll schedule a free site assessment and provide a detailed solar proposal.',
      },
    ],
  },
  {
    slug: 'carcar-city',
    name: 'Carcar City',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.1061, lng: 123.6403 },
    nearbyAreas: ['Poblacion Carcar', 'Bolinawan', 'Cansomoroy', 'Ocaña', 'Tuyom', 'Valencia', 'Guadalupe'],
    intro:
      'Carcar City, known for its heritage district and growing residential communities in southern Cebu, is part of JMC Solar PH\'s Cebu service area. We install solar energy systems for Carcar homes and businesses, providing clean power and significant electricity cost reductions.',
    whyJmc: [
      'Serving Carcar City and southern Cebu residential communities',
      'Hybrid solar systems with battery backup for power security',
      'Net metering support for eligible Carcar properties',
      'All installations by licensed electrical engineers',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH serve Carcar City, Cebu?',
        a: 'Yes. We install solar energy systems throughout Carcar City as part of our Cebu service network.',
      },
      {
        q: 'What solar system size do I need for my Carcar City home?',
        a: 'System size depends on your electricity consumption. Most Carcar City households benefit from a 3–8 kWp system. We size the system precisely during your free assessment.',
      },
      {
        q: 'Is net metering available for Carcar City properties?',
        a: 'Yes, for qualifying on-grid and hybrid systems. JMC Solar PH coordinates the net metering application with your distribution utility.',
      },
    ],
  },
  {
    slug: 'minglanilla',
    name: 'Minglanilla',
    tier: 'municipality',
    province: 'Cebu',
    region: 'Central Visayas',
    geo: { lat: 10.2447, lng: 123.7975 },
    nearbyAreas: ['Poblacion Minglanilla', 'Cadulawan', 'Calajo-an', 'Linao', 'Pakigne', 'Tubod', 'Ward 1', 'Ward 2', 'Cuanos'],
    intro:
      'Minglanilla is a fast-developing municipality in southern Metro Cebu with a booming residential sector and growing commercial strip. JMC Solar PH provides professional solar installation services for Minglanilla homeowners and businesses looking to reduce electricity costs and contribute to a greener Cebu.',
    whyJmc: [
      'Growing number of completed solar installations in Minglanilla',
      'Expert VECO net metering application handling',
      'Hybrid systems ideal for Minglanilla\'s residential subdivisions',
      'Competitive pricing with free site assessment',
    ],
    faqs: [
      {
        q: 'Can JMC Solar PH install solar in Minglanilla, Cebu?',
        a: 'Yes. We serve Minglanilla with full solar installation services for homes and businesses.',
      },
      {
        q: 'What is the best solar package for a home in Minglanilla?',
        a: 'Most Minglanilla homeowners opt for a 5–8 kWp hybrid system. We provide a tailored proposal based on your actual energy usage and roof space.',
      },
      {
        q: 'How long does solar installation take in Minglanilla?',
        a: 'Residential solar installations in Minglanilla are typically completed in 1–3 days after system design is finalized.',
      },
    ],
  },

  // ===== PROVINCES (umbrella) =====
  {
    slug: 'leyte',
    name: 'Leyte',
    tier: 'province',
    region: 'Eastern Visayas',
    geo: { lat: 10.8731, lng: 124.8807 },
    childSlugs: ['ormoc-city', 'tacloban-city', 'baybay-city', 'inopacan', 'hindang', 'hilongos', 'bato', 'matalom'],
    nearbyAreas: [],
    intro:
      'JMC Solar PH is Leyte\'s trusted solar installation company, headquartered in Ormoc City and serving all major cities and municipalities across the province. From Tacloban in the north to Matalom in the south, our licensed team delivers professional solar energy solutions for residential, commercial, agricultural, and industrial clients throughout Leyte.',
    whyJmc: [
      'Province-wide coverage — Ormoc, Tacloban, Baybay, and beyond',
      'Local expertise in LEYECO and LEYTE II ELECTRIC COOPERATIVE grid conditions',
      'Completed solar installations in 8+ Leyte municipalities',
      'DOE-registered contractor with licensed electrical engineers on every project',
    ],
    faqs: [
      {
        q: 'Which municipalities in Leyte does JMC Solar PH serve?',
        a: 'We serve Ormoc City, Tacloban City, Baybay City, Inopacan, Hindang, Hilongos, Bato, and Matalom — with more areas being added regularly.',
      },
      {
        q: 'Is solar a good investment in Leyte?',
        a: 'Yes. Leyte receives excellent solar irradiation (4.5–5.5 peak sun hours/day). Combined with relatively high electricity rates, solar ROI in Leyte is typically 4–7 years.',
      },
      {
        q: 'Can I apply for net metering in Leyte?',
        a: 'Yes. JMC Solar PH handles net metering applications with LEYECO and LEYTE II for qualifying on-grid and hybrid systems across Leyte.',
      },
      {
        q: 'Do you install solar for commercial properties in Leyte?',
        a: 'Yes. We install commercial and industrial solar systems throughout Leyte, including factories, resorts, hospitals, and government buildings.',
      },
    ],
  },
  {
    slug: 'southern-leyte',
    name: 'Southern Leyte',
    tier: 'province',
    region: 'Eastern Visayas',
    geo: { lat: 10.3333, lng: 125.1667 },
    childSlugs: ['maasin-city', 'macrohon', 'sogod'],
    nearbyAreas: [],
    intro:
      'Southern Leyte is an emerging market for solar energy, and JMC Solar PH is proud to serve its municipalities including Maasin City, Sogod, and Macrohon. Our systems are engineered for Southern Leyte\'s coastal climate and SOLECO grid conditions, delivering reliable clean energy to homes and businesses across the province.',
    whyJmc: [
      'Serving Southern Leyte\'s capital (Maasin City) and key municipalities',
      'SOLECO net metering application support',
      'Coastal-grade systems built to withstand Southern Leyte\'s typhoon climate',
      'Agricultural solar for Southern Leyte\'s farming communities',
    ],
    faqs: [
      {
        q: 'Does JMC Solar PH serve Southern Leyte?',
        a: 'Yes. We serve Maasin City, Sogod, and Macrohon in Southern Leyte, with plans to expand coverage.',
      },
      {
        q: 'What electric cooperative covers Southern Leyte?',
        a: 'Most of Southern Leyte is served by the Southern Leyte Electric Cooperative (SOLECO). JMC Solar PH is familiar with SOLECO\'s net metering and grid interconnection requirements.',
      },
      {
        q: 'Is solar worth it in Southern Leyte?',
        a: 'Yes. Southern Leyte\'s high solar irradiation and relatively high electricity rates make solar a strong investment with typical payback periods of 4–7 years.',
      },
    ],
  },
  {
    slug: 'cebu',
    name: 'Cebu Province',
    tier: 'province',
    region: 'Central Visayas',
    geo: { lat: 10.3157, lng: 123.8854 },
    childSlugs: ['cebu-city', 'mandaue-city', 'talisay-cebu', 'liloan', 'consolacion', 'danao-city', 'carcar-city', 'minglanilla'],
    nearbyAreas: [],
    intro:
      'JMC Solar PH is expanding its solar installation services across Cebu Province, serving cities and municipalities in both Metro Cebu and surrounding areas. With Central Visayas\' booming real estate market and rising electricity costs, Cebu is one of the Philippines\' fastest-growing solar markets — and our licensed team is ready to serve.',
    whyJmc: [
      'Serving 8 Cebu cities and municipalities — Metro Cebu and beyond',
      'Expert knowledge of VECO, MECO, and RECo net metering requirements',
      'High-performance systems designed for Cebu\'s urban and suburban properties',
      'Commercial, industrial, and residential solar expertise',
    ],
    faqs: [
      {
        q: 'Which areas in Cebu does JMC Solar PH cover?',
        a: 'We serve Cebu City, Mandaue City, Talisay City, Liloan, Consolacion, Danao City, Carcar City, and Minglanilla — with more areas being added.',
      },
      {
        q: 'Who is the electric utility in Metro Cebu for net metering?',
        a: 'Visayas Electric Company (VECO) serves Cebu City and surrounding areas. Mandaue is served by MECO. JMC Solar PH handles net metering applications for all Cebu utilities.',
      },
      {
        q: 'Is solar worth it in Cebu given the high electricity rates?',
        a: 'Absolutely. Cebu electricity rates are among the highest in Visayas. Solar typically delivers a 4–6 year payback period and 25+ years of free power afterward.',
      },
      {
        q: 'Do you install large commercial solar systems in Cebu?',
        a: 'Yes. We install commercial and industrial solar systems in Cebu Province, ranging from 10 kWp rooftop systems to 500+ kWp industrial installations.',
      },
    ],
  },
];

export function getLocation(slug: string): ServiceLocation | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}

export function getMunicipalityLocations(): ServiceLocation[] {
  return LOCATIONS.filter((l) => l.tier === 'municipality');
}

export function getProvinceLocations(): ServiceLocation[] {
  return LOCATIONS.filter((l) => l.tier === 'province');
}

export function getProvinceSlug(provinceName: string | undefined): string | undefined {
  if (!provinceName) return undefined;
  return LOCATIONS.find((l) => l.tier === 'province' && l.name === provinceName)?.slug;
}
