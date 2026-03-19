'use client';
import { useEffect } from 'react';

export default function AdminReviewsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="font-display font-black text-navy-950 text-lg mb-1">Failed to load reviews</h2>
      <p className="text-slate-400 text-sm mb-6 max-w-xs">{error.message || 'Something went wrong fetching data from the database.'}</p>
      <button
        onClick={reset}
        className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
