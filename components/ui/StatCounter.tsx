'use client';

import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface StatCounterProps {
  value: string;
  label: string;
  icon?: ReactNode;
  light?: boolean;
}

export default function StatCounter({ value, label, icon, light = false }: StatCounterProps) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : value;

  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [isInView, target]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-1">
      {icon && <div className={`mb-1 ${light ? 'text-solar-400' : 'text-solar-500'}`}>{icon}</div>}
      <span
        className={`text-3xl lg:text-4xl font-black ${light ? 'text-white' : 'text-navy-900'}`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {count}{suffix}
      </span>
      <span className={`text-sm font-medium ${light ? 'text-slate-300' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}