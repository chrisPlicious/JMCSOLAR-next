"use client";

import { useEffect, useState, useRef } from "react";
const solarBg = "/assets/bg-1.jpg";
import { ArrowRight, ChevronDown, Star, Users, Zap, Sun } from "lucide-react";
import { motion } from "framer-motion";
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
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const [displayText, setDisplayText] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const word = words[currentIndex];

    if (phase === "typing") {
      if (displayText.length < word.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(word.slice(0, displayText.length + 1));
        }, 100);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pause"), 80);
      }
    } else if (phase === "pause") {
      timeoutRef.current = setTimeout(() => setPhase("erasing"), 2000);
    } else if (phase === "erasing") {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 60);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, phase, currentIndex]);

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
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${solarBg})` }}
      />

      {/* Multi-layer gradient overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/85 to-navy-900/60" /> */}
      <div className="absolute inset-0 bg-linear-to-t from-navy-950/50 via-transparent to-navy-950/30" />

      {/* Decorative organic blobs */}
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
            className={`lg:col-span-7 text-center lg:text-left transition-all duration-1000 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
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
              className="text-white font-black text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1.05] mb-8"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Future is{" "}
              <span className="relative inline-block text-solar-400">
                {/* The Ghost Word */}
                <span className="invisible pointer-events-none">
                  Sustainable
                </span>
                {/* The Typing Overlay */}
                <span className="absolute inset-0 flex items-center justify-center lg:justify-start">
                  {displayText}
                  {/* Blinking cursor */}
                  <span className="inline-block w-[3px] h-[0.85em] bg-solar-400 ml-1 rounded-sm animate-[blink_0.8s_step-end_infinite]" />
                </span>
                {/* Underline decoration */}
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-linear-to-r from-solar-500 to-solar-300 rounded-full opacity-60" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/70 text-lg sm:text-xl lg:text-2xl max-w-2xl mb-4 leading-relaxed mx-auto lg:mx-0">
              Professional Solar Installation Services in{" "}
              <span className="text-white font-semibold">
                Ormoc City, Leyte
              </span>
            </p>
            <p className="text-white/50 text-base max-w-xl mb-10 mx-auto lg:mx-0">
              From residential rooftops to 100kW+ industrial solar farms — we
              make clean, free energy accessible for every Filipino.
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
          className={`lg:hidden grid grid-cols-2 gap-3 max-w-md mx-auto transition-all duration-1000 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
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
