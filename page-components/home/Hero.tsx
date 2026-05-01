"use client";

import { useEffect, useState } from "react";
const solarBg = "/assets/bg-1.jpg";
import { ArrowRight, ChevronDown, Star, Users, Zap, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

const stats = [
  { value: "100%", label: "Recommend Rate", icon: <Star size={18} /> },
  { value: "3.3K+", label: "Facebook Followers", icon: <Users size={18} /> },
  { value: "6–1MW+", label: "System Capacities", icon: <Zap size={18} /> },
  { value: "9+", label: "Completed Projects", icon: <Sun size={18} /> },
];

const words = ["Electric", "Renewable", "Sustainable", "Now"];

export default function Hero() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollToAbout = () => {
    const el = document.querySelector("#about");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center overflow-x-hidden"
    >
      {/* Background is now handled globally by HeroBgLayer to prevent fade-in */}

      {/* Decorative organic blobs — overflow-hidden is on this wrapper, not the section, so content can expand vertically */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large solar glow blob - top right */}
        {/* <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] blob-shape animate-pulse-glow opacity-20"
          style={{
            background: "radial-gradient(circle, #f59e0b 0%, #d97706 30%, transparent 70%)",
          }}
        /> */}
        {/* Smaller accent blob - bottom left */}
        <div
          className="absolute bottom-20 -left-20 w-[300px] h-[300px] blob-shape-2 animate-float-slower opacity-10"
          style={{
            background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
          }}
        />
        {/* Decorative ring - mid right */}
        <div className="absolute top-1/3 right-[15%] w-64 h-64 rounded-full border border-white/5 animate-spin-slow hidden lg:block" />
        <div
          className="absolute top-1/3 right-[15%] w-48 h-48 rounded-full border border-solar-500/10 animate-spin-slow hidden lg:block"
          style={{ animationDirection: "reverse", animationDuration: "15s" }}
        />

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ">
          {/* Left Column - Text */}
          <div
            className={`lg:col-span-7 text-center lg:text-left transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-solar-400 animate-pulse" />
              <span className="text-white/80 text-sm font-medium">
                Renewable Energy Advocates
              </span>
            </motion.div>

            {/* Headline */}
            <h1
              className="text-white font-black text-4xl sm:text-5xl lg:text-7xl xl:text-[5.5rem] leading-[1.05] mb-8"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Future is{" "}
              <span className="relative inline-block text-solar-400 overflow-hidden">
                {/* Ghost word to hold width */}
                <span className="invisible pointer-events-none">
                  Sustainable
                </span>
                {/* Rotating word */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    className="absolute inset-0 flex items-center justify-center lg:justify-start"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {words[currentIndex]}
                  </motion.span>
                </AnimatePresence>
                {/* Underline decoration */}
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-linear-to-r from-solar-500 to-solar-300 rounded-full opacity-60" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white text-lg sm:text-xl lg:text-2xl max-w-2xl mb-4 leading-relaxed mx-auto lg:mx-0">
              Professional Solar Installation Services in{" "}
              <span className="text-white font-semibold">
                Ormoc City, Leyte
              </span>
            </p>
            <p className="text-white text-lg max-w-xl mb-10 mx-auto lg:mx-0">
              Every installation is carried out by a duly licensed electrical engineer, backed by a professionally trained team — ensuring safety, compliance, and precision from start to finish.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-16">
              <Link
                href="/#contact"
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                Get a Free Quote
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/projects"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                View Our Projects
              </Link>
            </div>
          </div>

          {/* Right Column - Floating Stat Cards */}
          <div className="lg:col-span-5 hidden lg:block relative h-[420px]" >
            {stats.map((stat, i) => {
              const positions = [
                { top: "0%", left: "10%", delay: 0.3 },
                { top: "5%", left: "55%", delay: 0.45 },
                { top: "48%", left: "0%", delay: 0.6 },
                { top: "52%", left: "50%", delay: 0.75 },
              ];
              const pos = positions[i];

              return (
                <motion.div
                  key={stat.label}
                  className="absolute glass rounded-2xl p-5 min-w-[180px] hover:bg-white/12 hover:scale-102 hover:translate-y-[-5px] transition-all duration-300"
                  style={{ top: pos.top, left: pos.left }}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: pos.delay,
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <div className="text-solar-400 mb-2">{stat.icon}</div>
                  <div
                    className="text-white font-black text-3xl mb-1"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-white/50 text-xs font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}

            {/* Decorative floating circle */}
            <motion.div
              className="absolute top-[35%] left-[38%] w-20 h-20 rounded-full border-2 border-solar-500/20"
              animate={{ y: [0, -12, 0], rotate: [0, 90, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Mobile Stats Strip */}
        <div
          className={`lg:hidden grid grid-cols-2 gap-3 max-w-md mx-auto transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-solar-400 flex justify-center mb-1">
                {stat.icon}
              </div>
              <div
                className="text-white font-black text-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-solar-400 transition-colors animate-bounce cursor-pointer"
        aria-label="Scroll down"
      >
        <ChevronDown size={32} />
      </button>

      {/* Bottom gradient fade */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" /> */}
    </section>
  );
}
