'use client';

import { useRef, useEffect } from 'react';

interface SmoothMarqueeProps {
  children: React.ReactNode;
  direction: 'left' | 'right';
}

export default function SmoothMarquee({ children, direction }: SmoothMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleHover = (isEntering: boolean) => {
    if (!containerRef.current) return;
    
    // The Web Animations API allows us to hook into the CSS animations applied to this element
    const animations = containerRef.current.getAnimations();
    if (animations.length === 0) return;

    // Set target speed: 15% speed on hover, 100% (1) on leave
    const targetRate = isEntering ? 0.15 : 1; 
    const startRates = animations.map(anim => anim.playbackRate);
    const startTime = performance.now();
    const duration = 400; // 400ms duration for the easing transition

    // Easing function for smooth deceleration/acceleration
    const easeOutQuad = (t: number) => t * (2 - t);

    const updateRate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutQuad(progress);

      animations.forEach((anim, i) => {
        // Interpolate between the current speed and the target speed
        anim.playbackRate = startRates[i] + (targetRate - startRates[i]) * ease;
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(updateRate);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateRate);
  };

  return (
    <div
      ref={containerRef}
      className={`marquee-${direction} flex w-max relative z-[1] py-4 -my-4 transition-[z-index] duration-0 hover:z-50`}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      {children}
    </div>
  );
}