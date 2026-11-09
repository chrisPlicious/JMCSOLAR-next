"use client";

import { useScroll, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  stats?: {
    projectCount: number;
  };
}

function YearStats({
  stats,
  isActive,
}: {
  stats: { projectCount: number };
  isActive: boolean;
}) {
  return (
    <div className={`mt-3 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-50"}`}>
      <div className="w-10 h-0.5 bg-solar-500 rounded-full mb-3" aria-hidden />
      <p className="flex items-baseline gap-2">
        <span className="font-display text-h2 tabular-nums text-solar-ink">{stats.projectCount}</span>
        <span className="caps text-fg-muted">Projects</span>
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
      className="flex justify-start pt-10 lg:pt-32 lg:gap-10"
    >
      {/* Sticky category label — left side (lg+) */}
      <div className="sticky flex flex-col z-30 top-32 self-start max-w-xs lg:max-w-sm lg:w-full">
        <div className="h-10 absolute left-3 w-10 rounded-full bg-white flex items-center justify-center" aria-hidden>
          <div
            className={`h-4 w-4 rounded-full border-2 border-solar-500 transition-colors duration-300 ${
              isActive ? "bg-solar-500" : "bg-solar-100"
            }`}
          />
        </div>
        <div className="hidden lg:flex lg:flex-col lg:pl-20">
          {/* Desktop copy of the label. The <h2> below is the one real heading
              (only one of the two is ever displayed); role/aria-level keep this
              one announced as a heading without a duplicate <h2> in the DOM. */}
          <p
            role="heading"
            aria-level={2}
            className={`text-h2 transition-colors duration-300 ${
              isActive ? "text-solar-ink" : "text-fg"
            }`}
          >
            {item.title}
          </p>
          {item.stats && <YearStats stats={item.stats} isActive={isActive} />}
        </div>
      </div>

      {/* Content — right side */}
      <div className="relative pl-20 lg:pl-4 w-full min-w-0">
        <div className="lg:hidden mb-4">
          <h2
            className={`text-h3 transition-colors duration-300 ${
              isActive ? "text-fg" : "text-fg-subtle"
            }`}
          >
            {item.title}
          </h2>
          {item.stats && <YearStats stats={item.stats} isActive={isActive} />}
        </div>
        {item.content}
      </div>
    </div>
  );
}

/**
 * Distance from the viewport top to the centre of a pinned category dot:
 * the sticky label sits at `top-32` (128px) and the dot well is 40px tall.
 * The progress line's tip is locked to this line, so it always ends exactly
 * at the active category's dot and can never scroll out of view.
 */
const PINNED_DOT_Y = 148;

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // 0 when the track's top reaches the pinned-dot line, 1 when its bottom
  // does. Driven directly by scroll (no spring), so the tip never lags.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: [`start ${PINNED_DOT_Y}px`, `end ${PINNED_DOT_Y}px`],
  });

  return (
    <div className="relative w-full">
      <div className="relative mx-auto pb-10">
        {data.map((item, index) => (
          <TimelineItem key={index} item={item} />
        ))}

        {/* Progress line: from the first dot (item padding + half the 40px
            well) to the end of the list. Grows with scaleY, not height. */}
        <div
          ref={trackRef}
          aria-hidden
          className="absolute top-15 bottom-0 left-8 w-0.5 -translate-x-1/2 rounded-full bg-slate-200 lg:top-37"
        >
          <motion.div
            style={{ scaleY: scrollYProgress }}
            className="absolute inset-0 origin-top rounded-full bg-solar-500"
          />
        </div>
      </div>
    </div>
  );
};
