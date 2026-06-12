'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  leftTag?: string;
  leftTitle: ReactNode;
  leftDescription?: string;
  children: ReactNode;
}

const easeExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function BookingSplitLayout({ leftTitle, leftDescription, children }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FBF9F6]">
      {/* Left Column */}
      <div className="w-full lg:w-[30%] bg-navy-950 text-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden shrink-0 min-h-[400px] lg:min-h-screen lg:sticky lg:top-0">
        <div className="relative z-10">
          <motion.h1
            className="text-4xl lg:text-[65px] font-black mb-6 leading-[1.05] tracking-tight"
            style={{ fontFamily: 'Poppins, sans-serif' }}
            initial={{ opacity: 0, y: reduce ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeExpo, delay: 0.1 }}
          >
            {leftTitle}
          </motion.h1>
          {leftDescription && (
            <motion.p
              className="text-white/70 text-md leading-relaxed max-w-sm"
              initial={{ opacity: 0, y: reduce ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeExpo, delay: 0.28 }}
            >
              {leftDescription}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 w-full flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}