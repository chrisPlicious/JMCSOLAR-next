"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Star, Users, Zap, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { DURATION, EASE_OUT, fadeUp, stagger } from "@/lib/motion";

const stats = [
  { value: "100%", label: "Recommend Rate", icon: <Star size={18} aria-hidden /> },
  { value: "3.3K+", label: "Facebook Followers", icon: <Users size={18} aria-hidden /> },
  { value: "6–1MW+", label: "System Capacities", icon: <Zap size={18} aria-hidden /> },
  { value: "9+", label: "Completed Projects", icon: <Sun size={18} aria-hidden /> },
];

// Staggered ("tilted") arrangement of the desktop stat cards.
const STAT_POSITIONS = [
  { top: "0%", left: "10%", delay: 0.3 },
  { top: "5%", left: "55%", delay: 0.45 },
  { top: "48%", left: "0%", delay: 0.6 },
  { top: "52%", left: "50%", delay: 0.75 },
];

const words = ["Electric", "Renewable", "Sustainable", "Now"];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const scrollToAbout = () => {
    const el = document.querySelector("#about");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="surface-dark relative flex min-h-[100svh] items-center overflow-x-hidden">
      {/* Background photo is handled globally by HeroBgLayer to prevent fade-in */}
      <Container className="relative z-10 pt-28 pb-24 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Column - Text */}
          <motion.div
            className="text-center lg:col-span-7 lg:text-left"
            variants={stagger(0.08)}
            initial="hidden"
            animate="visible"
          >
            {/* Rotating tagline: the page's single eyebrow. H1 holds the primary keyword. */}
            <motion.p
              variants={fadeUp}
              className="eyebrow mb-4 flex flex-wrap items-center justify-center gap-x-1.5 lg:justify-start"
            >
              <span>Future is</span>
              <span className="relative inline-flex overflow-hidden">
                <span className="pointer-events-none invisible">Sustainable</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    className="absolute inset-0 flex items-center justify-start"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  >
                    {words[currentIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.p>

            <motion.h1 variants={fadeUp} className="mb-8 text-display text-fg">
              Premium Solar Installations <span className="text-solar-ink">for You</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mb-4 max-w-2xl text-lead text-fg lg:mx-0">
              Professional Solar Installation Services in{" "}
              <span className="font-semibold">Ormoc City, Eastern Visayas &amp; Cebu, Central Visayas</span>
            </motion.p>
            <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-xl text-base text-fg-muted lg:mx-0">
              Every installation is carried out by a duly licensed electrical engineer, backed by a professionally trained team — ensuring safety, compliance, and precision from start to finish.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Button href="/booking" size="lg">
                Get a quote
              </Button>
              <Button href="/#contact" variant="outline-dark" size="lg">
                Message us
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Stats. Desktop: staggered floating cards. */}
          <ul className="relative hidden h-105 lg:col-span-5 lg:block">
            {stats.map((stat, i) => {
              const pos = STAT_POSITIONS[i];
              return (
                <motion.li
                  key={stat.label}
                  className="frosted absolute min-w-45 rounded-card p-5 transition-[translate,scale] duration-300 ease-out-quart hover:-translate-y-1 hover:scale-[1.02]"
                  style={{ top: pos.top, left: pos.left }}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: pos.delay, duration: DURATION.slow, ease: EASE_OUT }}
                >
                  <div className="mb-2 text-solar-ink">{stat.icon}</div>
                  <div className="font-display text-h2 text-fg tabular-nums">{stat.value}</div>
                  <div className="mt-1 text-xs font-medium text-fg-muted">{stat.label}</div>
                </motion.li>
              );
            })}
          </ul>

          {/* Mobile / tablet: 2 × 2 grid */}
          <motion.ul
            className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4 lg:hidden"
            variants={stagger(0.08, 0.3)}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat) => (
              <motion.li key={stat.label} variants={fadeUp} className="frosted rounded-card p-4 text-center sm:p-5">
                <div className="mb-2 flex justify-center text-solar-ink">{stat.icon}</div>
                <div className="font-display text-h2 text-fg tabular-nums">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-fg-muted">{stat.label}</div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>

      {/* Scroll Indicator */}
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollToAbout}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-fg-muted hover:bg-white/10 hover:text-fg sm:inline-flex"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} aria-hidden />
      </Button>
    </section>
  );
}
