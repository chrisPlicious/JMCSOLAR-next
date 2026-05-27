import { ReactNode } from 'react';

interface Props {
  leftTag?: string;
  leftTitle: ReactNode;
  leftDescription?: string;
  children: ReactNode;
}

export default function BookingSplitLayout({ leftTitle, leftDescription, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FBF9F6]">
      {/* Left Column */}
      <div className="w-full lg:w-[38%] bg-navy-950 text-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden shrink-0 min-h-[400px] lg:min-h-screen lg:sticky lg:top-0">
        <div className="relative z-10">
          <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {leftTitle}
          </h1>
          {leftDescription && (
            <p className="text-white/70 text-xl leading-relaxed max-w-sm">
              {leftDescription}
            </p>
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