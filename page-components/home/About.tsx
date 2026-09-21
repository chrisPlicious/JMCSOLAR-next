'use client';

import { useRef } from "react";
import { CheckCircle2, Leaf, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fadeUp, revealOnScroll, stagger } from "@/lib/motion";
const solarImg = '/assets/solar.jpg';

const highlights = [
  "DOE/ERC compliant solar installations",
  "6kW to 1MW system capacities",
  "Serving all of Leyte and Eastern Visayas",
  "Certified dealer of world-class solar brands",
];

const serviceAreas = [
  "Ormoc City",
  "Cebu Port Center",
  "ZBO",
  "Ipil",
  "Eastern Visayas",
];

const tags = [
  ...serviceAreas.map((a) => ({
    label: `#${a.replace(/\s+/g, "")}`,
    accent: false,
  })),
  { label: "#CertifiedDealer", accent: true },
  { label: "#DOE_ERC", accent: true },
];

export default function About() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <Section id="about" tone="white" className="overflow-hidden">
      <motion.div variants={fadeUp} {...revealOnScroll}>
        <SectionHeader title="We drive innovation to provide free and clean energy for every industry." />
      </motion.div>

      {/* ── Three-card trio ─────────────────────────────── */}
      <motion.div
        className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mb-24"
        variants={stagger(0.08)}
        {...revealOnScroll}
      >
        {/* Card 1 — Dark stat card */}
        <Card as={motion.div} variants={fadeUp} variant="dark" padding="lg" className="flex flex-col justify-between gap-12">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg-muted">Solar Solutions</span>
            <span className="flex size-10 items-center justify-center rounded-control bg-white/10">
              <Zap size={18} className="text-solar-ink" aria-hidden />
            </span>
          </div>

          <div className="space-y-5 border-t border-line pt-6">
            <div>
              <span className="block font-display text-h2 text-fg tabular-nums">15+</span>
              <span className="text-sm text-fg-muted">Brand Partners</span>
            </div>
            <div>
              <span className="block font-display text-h2 text-fg tabular-nums">10+</span>
              <span className="text-sm text-fg-muted">Projects Completed</span>
            </div>
          </div>
        </Card>

        {/* Card 2 — Photo card */}
        <motion.div
          variants={fadeUp}
          className="surface-dark relative aspect-[4/3] overflow-hidden rounded-card md:aspect-auto md:min-h-full"
        >
          <img
            src="/aboutSolar.jpg"
            alt="JMC Solar Team at Work"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-navy-950/85 via-navy-950/25 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
            <h3 className="mb-2 text-h3 text-fg">Our Vision</h3>
            <p className="text-sm text-fg-muted">
              Provide free and clean energy for every industry — from homes to
              commercial establishments.
            </p>
          </div>
        </motion.div>

        {/* Card 3 — Light info card with hashtag badges */}
        <Card as={motion.div} variants={fadeUp} padding="lg" className="flex flex-col justify-between">
          <div>
            <p className="mb-3 text-title text-fg">
              Always committed to quality solar installations for a
              sustainable future
            </p>
            <p className="text-sm text-fg-muted">
              DOE/ERC compliant installations serving the entire Visayas
              region with world-class solar brands.
            </p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-8">
            {tags.map((tag) => (
              <Badge key={tag.label} tone={tag.accent ? "solar" : "neutral"}>
                {tag.label}
              </Badge>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Split content section ───────────────────────── */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left — Text content */}
        <motion.div variants={fadeUp} {...revealOnScroll}>
          <h2 className="mb-6 text-h2 text-fg">
            Renewable Energy Advocates for the Philippines
          </h2>

          <p className="mb-4 text-lead text-fg-muted">
            JMC Solar PH — also known as JMC Power — is a renewable energy
            company headquartered in Ormoc City, Leyte. We are passionate
            advocates for the shift toward clean, sustainable energy throughout
            the Visayas region.
          </p>
          <p className="mb-8 text-fg-muted">
            Our mission is simple:{" "}
            <strong className="text-fg">
              provide free and clean energy for every industry
            </strong>{" "}
            — from small residential homes to large commercial establishments
            and industrial operations.
          </p>

          <motion.ul className="mb-10 space-y-3.5" variants={stagger(0.07)} {...revealOnScroll}>
            {highlights.map((item) => (
              <motion.li key={item} variants={fadeUp} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-eco-bg">
                  <CheckCircle2 size={15} className="text-green-eco" aria-hidden />
                </span>
                <span className="text-sm font-medium text-fg">{item}</span>
              </motion.li>
            ))}
          </motion.ul>

          <Button variant="secondary" href="/#contact">
            Message us
          </Button>
        </motion.div>

        {/* Right — Large parallax image with stat badge */}
        <motion.div ref={imageRef} className="relative" variants={fadeUp} {...revealOnScroll}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-panel">
            <motion.img
              src={solarImg}
              alt="Solar Installation"
              className="absolute inset-0 h-[120%] w-full object-cover"
              style={{ y: imageY, top: "-10%" }}
            />
          </div>

          <div className="absolute right-6 bottom-6 rounded-card border border-line bg-white/90 p-5 shadow-elevated backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-control bg-green-eco-bg">
                <Leaf size={20} className="text-green-eco" aria-hidden />
              </span>
              <div>
                <span className="block font-display text-h3 text-fg tabular-nums">100%</span>
                <span className="text-xs font-medium text-fg-muted">Recommend Rate</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
