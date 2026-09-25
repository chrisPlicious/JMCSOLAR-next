"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { fadeUp, revealOnScroll, stagger } from "@/lib/motion";

const partners = [
  { name: "Sofar Solar", logo: "/Logos/SOFARSOLAR.png" },
  { name: "Solax Power", logo: "/Logos/SOLAX.png" },
  { name: "JinKO Solar", logo: "/Logos/JINKOSOLAR.png" },
  { name: "Trina Solar", logo: "/Logos/TRINASOLAR.png" },
  { name: "Sunri", logo: "/Logos/SUNRI.png" },
  { name: "REC Group", logo: "/Logos/REC.png" },
  { name: "Deye", logo: "/Logos/DEYE.png" },
  { name: "Livoltek", logo: "/Logos/LIVOLTEK.png" },
  { name: "LVTOPSUN", logo: "/Logos/LVTOPSUN.png" },
  { name: "Voltronic Power", logo: "/Logos/VOLTRONICPOWER.png" },
  { name: "SRNE Solar", logo: "/Logos/SRNE.png" },
  { name: "Japan Solar", logo: "/Logos/JAPAN%20SOLAR.png" },
  { name: "Think Power", logo: "/Logos/THINK POWER.png" },
];

const doubled = [...partners, ...partners];

// Desktop grid. Two logo heights only: most files are tightly cropped (h-24);
// a few carry extra whitespace in the artwork and need the larger step (h-32).
type GridLogo = { name: string; logo: string; large?: boolean };
const gridColumns: GridLogo[][] = [
  [
    { name: "Sofar Solar", logo: "/Logos/SOFARSOLAR.png" },
    { name: "Solax Power", logo: "/Logos/SOLAX.png" },
    { name: "JinKO Solar", logo: "/Logos/JINKOSOLAR.png" },
    { name: "Trina Solar", logo: "/Logos/TRINASOLAR.png" },
    { name: "Think Power", logo: "/Logos/THINK POWER.png", large: true },
  ],
  [
    { name: "REC Group", logo: "/Logos/REC.png" },
    { name: "Deye", logo: "/Logos/DEYE.png" },
    { name: "Livoltek", logo: "/Logos/LIVOLTEK.png" },
    { name: "Solis", logo: "/Logos/SOLIS.png" },
    { name: "LVTOPSUN", logo: "/Logos/LVTOPSUN.png", large: true },
  ],
  [
    { name: "SRNE Solar", logo: "/Logos/SRNE.png", large: true },
    { name: "Sunri", logo: "/Logos/SUNRI.png" },
    { name: "goodwe", logo: "/Logos/GOODWE.png" },
    { name: "HYXIPOWER", logo: "/Logos/HYXIPOWER.png" },
    { name: "aiko", logo: "/Logos/AIKO.png" },
  ],
];

function PartnerCard({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex min-w-36 items-center justify-center rounded-card border border-line bg-white px-6 py-5 shadow-soft">
      <img src={logo} alt={name} className="h-12 object-contain" loading="lazy" decoding="async" />
    </div>
  );
}

export default function Partners() {
  return (
    <Section id="partners" tone="white" className="overflow-hidden">
      <motion.div variants={fadeUp} {...revealOnScroll}>
        <SectionHeader
          align="center"
          title="Our Partner Brands"
          lead="We are an authorized multi-brand dealer and installer, carrying the world's leading solar equipment manufacturers to ensure the best system for your needs."
        />
      </motion.div>

      {/* Desktop: Logo Grid */}
      <div className="hidden grid-cols-3 gap-8 lg:grid">
        {gridColumns.map((column, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-8"
            variants={stagger(0.07, i * 0.1)}
            {...revealOnScroll}
          >
            {column.map((logo) => (
              <motion.img
                key={logo.name}
                variants={fadeUp}
                src={logo.logo}
                alt={logo.name}
                loading="lazy"
                decoding="async"
                className={cn(
                  "object-contain opacity-80 transition-opacity duration-300 hover:opacity-100",
                  logo.large ? "h-32" : "h-24",
                )}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Marquee — mobile & tablet */}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] lg:hidden">
        <div className="flex w-max animate-marquee gap-4">
          {doubled.map((partner, idx) => (
            <PartnerCard key={`${partner.name}-${idx}`} name={partner.name} logo={partner.logo} />
          ))}
        </div>
      </div>

      {/* Trust note */}
      <p className="mt-12 text-center text-sm text-fg-muted">
        All brands are supplied and installed by certified JMC Solar PH
        technicians.
      </p>
    </Section>
  );
}
