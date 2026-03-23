'use client';

import { useRef } from "react";
import { CheckCircle2, Leaf, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
const solarImg = '/assets/solar.jpg';

const highlights = [
  "DOE/ERC compliant solar installations",
  "6kW to 100kW+ system capacities",
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
    <section id="about" className="relative bg-warm overflow-hidden">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
        {/* ── Split header (Ref 3 style) ────────────────────── */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[13px] text-slate-400 uppercase tracking-[0.2em] font-medium">
            Who We Are
          </p>
          <h2
            className="text-navy-900 font-bold text-2xl sm:text-3xl lg:text-[2rem] max-w-lg leading-snug"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            We drive innovation to provide free and clean energy for every
            industry.
          </h2>
        </motion.div>

        {/* ── Three-card trio (Ref 3 + Ref 2 blend) ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20 lg:mb-28">
          {/* Card 1 — Dark stat card */}
          <motion.div
            className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden min-h-[360px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 blob-shape opacity-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-16">
                <span className="text-white/50 text-sm font-medium">
                  Solar Solutions
                </span>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Zap size={18} className="text-solar-400" />
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-5 border-t border-white/10 pt-6">
              <div>
                <span
                  className="text-white font-black text-4xl block"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  13+
                </span>
                <span className="text-white/50 text-sm">Brand Partners</span>
              </div>
              <div>
                <span
                  className="text-white font-black text-4xl block"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  9+
                </span>
                <span className="text-white/50 text-sm">
                  Projects Completed
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Photo card */}
          <motion.div
            className="rounded-3xl overflow-hidden relative min-h-[360px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <img
              src="/aboutSolar.jpg"
              alt="JMC Solar Team at Work"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h3
                className="text-white font-bold text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Our Vision
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Provide free and clean energy for every industry — from homes to
                commercial establishments.
              </p>
            </div>
          </motion.div>

          {/* Card 3 — Light info card with hashtag badges */}
          <motion.div
            className="bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 min-h-[360px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <p
                className="text-navy-900 font-semibold text-lg leading-snug mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Always committed to quality solar installations for a
                sustainable future
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                DOE/ERC compliant installations serving the entire Visayas
                region with world-class solar brands.
              </p>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`text-xs rounded-full px-3 py-1.5 font-medium border ${
                      tag.accent
                        ? "text-solar-600 bg-solar-500/10 border-solar-500/20"
                        : "text-slate-600 bg-slate-50 border-slate-100"
                    }`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Split content section (Ref 2 style) ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-solar-600 font-semibold text-sm uppercase tracking-widest mb-5">
              <span className="w-8 h-px bg-solar-500" />
              More About Us
            </span>

            <h2
              className="text-navy-900 font-black text-3xl sm:text-4xl leading-tight mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Renewable Energy{" "}
              <span className="text-solar-500">Advocates</span> for the
              Philippines
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-4">
              JMC Solar PH — also known as JMC Power — is a renewable energy
              company headquartered in Ormoc City, Leyte. We are passionate
              advocates for the shift toward clean, sustainable energy throughout
              the Visayas region.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              Our mission is simple:{" "}
              <strong className="text-navy-900">
                provide free and clean energy for every industry
              </strong>{" "}
              — from small residential homes to large commercial establishments
              and industrial operations.
            </p>

            {/* Staggered bullet points */}
            <ul className="space-y-3.5 mb-10">
              {highlights.map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div className="w-6 h-6 bg-green-eco/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={15} className="text-green-eco" />
                  </div>
                  <span className="text-slate-700 text-sm font-medium">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>

            <Button variant="secondary" size="md" href="/#contact">
              Get in Touch
            </Button>
          </motion.div>

          {/* Right — Large parallax image with floating stat badges */}
          <motion.div
            ref={imageRef}
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="rounded-3xl overflow-hidden relative aspect-[4/5]">
              <motion.img
                src={solarImg}
                alt="Solar Installation"
                className="absolute inset-0 w-full h-[120%] object-cover"
                style={{ y: imageY, top: "-10%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/20 to-transparent" />
            </div>

            {/* Floating stat badge — bottom-right (Ref 2 style) */}
            <motion.div
              className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-elevated border border-white/50"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-eco/10 rounded-xl flex items-center justify-center">
                  <Leaf size={20} className="text-green-eco" />
                </div>
                <div>
                  <span
                    className="text-navy-900 font-black text-2xl block"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    100%
                  </span>
                  <span className="text-slate-500 text-xs font-medium">
                    Recommend Rate
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Floating brand badge — top-left */}
            <motion.div
              className="absolute top-6 left-6 bg-navy-900/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-elevated"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              style={{
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="flex items-center gap-2">
                <Zap
                  size={16}
                  className="text-solar-400"
                  fill="currentColor"
                />
                <span className="text-white text-sm font-semibold">
                  JMC Solar PH
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}