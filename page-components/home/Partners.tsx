"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Sofar Solar", logo: "/Logos/SOFARSOLAR.png" },
  { name: "Solax Power", logo: "/Logos/SOLAX.png" },
  { name: "JinKO Solar", logo: "/Logos/JINKOSOLAR.png" },
  { name: "Trina Solar", logo: "/Logos/TRINASOLAR.png" },
  { name: "Sunri", logo: "/Logos/SUNRI.png" },
  { name: "REC Group", logo: "/Logos/REC.png" },
  { name: "Deye", logo: "/Logos/DEYE.png" },
  { name: "Livoltek", logo: "/Logos/LIVOLTEK.png" },
  { name: "LVTOPSUN", logo: "/Logos/LVTOPSUN.webp" },
  { name: "Voltronic Power", logo: "/Logos/VOLTRONICPOWER.png" },
  { name: "SRNE Solar", logo: "/Logos/SRNE.png" },
  { name: "Japan Solar", logo: "/Logos/JAPAN%20SOLAR.png" },
  { name: "Think Power", logo: "/Logos/THINK POWER.png" },
];

const doubled = [...partners, ...partners];

const logoVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function colVariants(delayChildren: number) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren } },
  };
}

function PartnerCard({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center justify-center bg-white rounded-2xl shadow-soft px-6 py-5 min-w-[140px] border border-slate-100/50 hover:shadow-card hover:border-solar-300/30 transition-all duration-300">
      <img src={logo} alt={name} className="h-12 object-contain" />
    </div>
  );
}

export default function Partners() {
  return (
    <section id="partners" className="relative py-24 bg-warm overflow-hidden">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
        }}
      />

      {/* Decorative blobs */}
      {/* <div className="absolute top-10 -left-20 w-60 h-60 bg-solar-400/5 blob-shape pointer-events-none" />
      <div className="absolute bottom-10 -right-16 w-48 h-48 bg-navy-200/8 blob-shape-2 pointer-events-none" /> */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-solar-600 font-semibold text-sm uppercase tracking-widest mb-5">
            <span className="w-8 h-px bg-solar-500" />
            Trusted Brands
            <span className="w-8 h-px bg-solar-500" />
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Our <span className="text-solar-500">Partner Brands</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            We are an authorized multi-brand dealer and installer, carrying the
            world's leading solar equipment manufacturers to ensure the best
            system for your needs.
          </p>
        </motion.div>

        {/* Desktop: Logo Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          <motion.div
            className="flex flex-col items-center gap-8"
            variants={colVariants(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.img
              variants={logoVariants}
              src="/Logos/SOFARSOLAR.png"
              alt="Sofar Solar"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/SOLAX.png"
              alt="Solax Power"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/JINKOSOLAR.png"
              alt="JinKO Solar"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/TRINASOLAR.png"
              alt="Trina Solar"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/THINK POWER.png"
              alt="Think Power"
              className="h-40 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-11"
            variants={colVariants(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.img
              variants={logoVariants}
              src="/Logos/REC.png"
              alt="REC Group"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/DEYE.png"
              alt="Deye"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/LIVOLTEK.png"
              alt="Livoltek"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/SOLIS.png"
              alt="Solis"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/LVTOPSUN.png"
              alt="LVTOPSUN"
              className="h-35 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-8"
            variants={colVariants(0.3)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.img
              variants={logoVariants}
              src="/Logos/SRNE.png"
              alt="SRNE Solar"
              className="h-30 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/SUNRI.png"
              alt="Sunri"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/GOODWE.png"
              alt="goodwe"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/HYXIPOWER.png"
              alt="HYXIPOWER"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
            <motion.img
              variants={logoVariants}
              src="/Logos/AIKO.png"
              alt="aiko"
              className="h-25 object-contain opacity-80 hover:opacity-100 hover:scale-102 ease-in-out transition-all duration-800"
            />
          </motion.div>
        </div>

        {/* Marquee — mobile & tablet */}
        <div className="lg:hidden overflow-hidden relative mb-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div
            className="flex gap-4 animate-marquee"
            style={{ width: "max-content" }}
          >
            {doubled.map((partner, idx) => (
              <PartnerCard
                key={`${partner.name}-${idx}`}
                name={partner.name}
                logo={partner.logo}
              />
            ))}
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-slate-400 text-sm mt-12">
          All brands are supplied and installed by certified JMC Solar PH
          technicians.
        </p>
      </div>
    </section>
  );
}
