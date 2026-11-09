import { cn } from '@/lib/utils';

/** Logo mark + "JMC SOLAR" wordmark. `light` is for navy or photo backgrounds. */
export function Wordmark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span className="flex items-center gap-2">
      <img src="/Logos/JMC SOLAR.png" alt="" aria-hidden className="size-9" />
      <span className="flex gap-1 font-wordmark text-xl leading-tight">
        <span className={cn('font-extrabold transition-colors duration-300', tone === 'light' ? 'text-white' : 'text-navy-950')}>
          JMC
        </span>
        <span className={cn('font-medium transition-colors duration-300', tone === 'light' ? 'text-white/80' : 'text-navy-500')}>
          SOLAR
        </span>
      </span>
    </span>
  );
}
