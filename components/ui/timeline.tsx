"use client";

import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  stats?: {
    projectCount: number;
    totalKwp: number;
  };
}

function YearStats({
  stats,
  isActive,
}: {
  stats: { projectCount: number; totalKwp: number };
  isActive: boolean;
}) {
  return (
    <div className={`mt-3 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-30"}`}>
      <div className="w-10 h-0.5 bg-solar-400 rounded-full mb-3" />
      <p className="leading-none mb-2">
        <span className="text-solar-500 font-bold text-lg">{stats.projectCount}</span>
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest ml-1.5">Projects</span>
      </p>
      <p className="leading-none">
        <span className="text-solar-500 font-bold text-2xl">{stats.totalKwp}</span>
        <span className="text-solar-500 font-semibold text-sm">kWp</span>
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest ml-1.5">Total Commissioned</span>
      </p>
    </div>
  );
}

function TimelineItem({ item }: { item: TimelineEntry }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: "-20% 0px -60% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={itemRef}
      className="flex justify-start pt-10 md:pt-40 md:gap-10"
    >
      {/* Sticky year label — left side */}
      <div className="sticky flex flex-col z-40 top-40 self-start max-w-xs lg:max-w-sm md:w-full">
        <div className="h-10 absolute left-3 w-10 rounded-full bg-white flex items-center justify-center">
          <div
            className={`h-4 w-4 rounded-full border-2 p-2 transition-colors duration-300 ${
              isActive
                ? "bg-solar-500 border-solar-500"
                : "bg-solar-100 border-solar-500"
            }`}
          />
        </div>
        <div className="hidden md:flex md:flex-col md:pl-20">
          <h3
            className={`text-7xl lg:text-8xl font-black transition-colors duration-300 ${
              isActive ? "text-solar-500" : "text-navy-900"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {item.title}
          </h3>
          {item.stats && <YearStats stats={item.stats} isActive={isActive} />}
        </div>
      </div>

      {/* Content — right side */}
      <div className="relative pl-20 pr-4 md:pl-4 w-full">
        <div className="md:hidden mb-4">
          <h3
            className={`text-4xl font-black text-left transition-colors duration-300 ${
              isActive ? "text-navy-900" : "text-navy-300"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {item.title}
          </h3>
          {item.stats && <YearStats stats={item.stats} isActive={isActive} />}
        </div>
        {item.content}
      </div>
    </div>
  );
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-white font-sans md:px-10" ref={containerRef}>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <TimelineItem key={index} item={item} />
        ))}

        {/* Animated progress line */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-solar-500 via-solar-400 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};