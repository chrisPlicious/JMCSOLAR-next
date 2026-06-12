const fs = require('fs');

function transformFile(filePath, type, title, stepTitle) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports
  if (!content.includes('BookingSplitLayout')) {
    content = content.replace("import { LOCATIONS } from '@/data/locations';", "import { LOCATIONS } from '@/data/locations';\nimport BookingSplitLayout from '../_components/BookingSplitLayout';\nimport Link from 'next/link';");
  }

  // Update classes
  content = content.replace(
    /const inputClass =[\s\S]+?';/,
    "const inputClass =\n  'w-full py-2 border-0 border-b border-slate-300 bg-transparent text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-sm min-h-[44px] px-0 rounded-none';"
  );
  content = content.replace(
    /const selectClass =[\s\S]+?';/,
    "const selectClass =\n  'w-full py-2 pr-8 border-0 border-b border-slate-300 bg-transparent text-navy-900 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-sm appearance-none min-h-[44px] cursor-pointer px-0 rounded-none';"
  );

  // FormField
  const newFormField = `function FormField({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={htmlFor} className="block text-[10px] font-bold tracking-widest uppercase text-navy-950">
          {label}
        </label>
        {optional && <span className="text-[10px] italic text-slate-400">optional</span>}
      </div>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5" role="alert">{error}</p>}
    </div>
  );
}`;
  content = content.replace(/function FormField\([\s\S]*?\}\) {[\s\S]*?return \([\s\S]*?<\label>[\s\S]*?<\/div>\s*;\s*\}/, newFormField);

  // SelectWrapper
  const newSelectWrapper = `function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-slate-400">
          <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}`;
  content = content.replace(/function SelectWrapper\([\s\S]*?\}\) {[\s\S]*?return \([\s\S]*?<\/svg>[\s\S]*?<\/div>\s*;\s*\}/, newSelectWrapper);

  content = content.replace(/\(optional\)/g, '');

  content = content.replace(/<h2 className="font-display font-bold text-xl text-navy-900 mb-1"[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<p className="text-slate-500 text-sm">[\s\S]*?<\/p>/g, (match, stepName) => {
    return `<p className="text-[10px] font-bold tracking-widest text-solar-500 uppercase mb-3">Step X of Y · ${stepTitle}</p>\n        <h2 className="font-serif text-4xl text-navy-950 tracking-tight">${stepName.trim()}.</h2>`;
  });
  
  let stepCounter = 1;
  content = content.replace(/Step X of Y/g, () => `Step ${stepCounter++} of 3`);

  const mainMatch = content.match(/return \(\s*<main className="min-h-screen[^>]+>([\s\S]*?)<\/main>\s*\);/);
  if (mainMatch) {
    const newRender = `return (
    <BookingSplitLayout
      leftTag="${type}"
      leftTitle="${title}"
    >
      <div className="flex-1 p-6 sm:p-12 lg:p-16 xl:p-24 max-w-3xl w-full mx-auto lg:mx-0 flex flex-col">
        <Link href="/booking" className="inline-flex items-center gap-2 text-slate-400 hover:text-navy-950 transition-colors text-sm font-medium mb-12 w-fit">
          <ChevronLeft size={16} />
          Back to index
        </Link>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-16 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className={\`relative bg-[#FBF9F6] px-3 sm:px-4 flex items-center gap-2 transition-colors \${active ? 'text-navy-950' : done ? 'text-slate-400' : 'text-slate-300'}\`}>
                <span className="font-serif text-sm">0{i + 1}</span>
                <span className="text-xs font-semibold hidden sm:inline-block tracking-wide">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="mb-auto min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {step === 0 && <Step1 formData={formData} errors={errors} update={update} />}
              {step === 1 && <Step2 formData={formData} errors={errors} update={update} />}
              {step === 2 && <Step3 formData={formData} errors={errors} update={update} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="pt-12 mt-12 border-t border-slate-200">
          {submitError && (
            <p className="text-red-500 text-sm mb-6 text-center bg-red-50 px-4 py-3" role="alert">
              {submitError}
            </p>
          )}
          <div className={\`flex gap-4 items-center \${step > 0 ? 'justify-between' : 'justify-end'}\`}>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-slate-400 hover:text-navy-950 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-3 px-8 py-3 rounded-full bg-navy-950 text-white font-bold text-xs tracking-widest hover:bg-navy-800 transition-colors min-h-[44px]"
              >
                CONTINUE
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-3 px-8 py-3 rounded-full bg-navy-950 text-white font-bold text-xs tracking-widest hover:bg-navy-800 transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    SUBMITTING…
                  </>
                ) : (
                  <>
                    CONFIRM BOOKING
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </BookingSplitLayout>
  );`;

    content = content.replace(/return \(\s*<main className="min-h-screen[^>]+>([\s\S]*?)<\/main>\s*\);/, newRender);
  }
  
  content = content.replace(/className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 min-h-\[44px\] \${/g, "className={`flex items-start gap-4 p-5 border-2 text-left transition-all duration-200 min-h-[44px] ${");
  content = content.replace(/active\s+\?\s+'border-solar-400 bg-solar-400\/5'\s+:\s+'border-slate-200 bg-white hover:border-slate-300'/g, "active ? 'border-solar-400 bg-white' : 'border-slate-200/60 bg-transparent hover:border-slate-300'");
  content = content.replace(/active \? 'bg-solar-400 text-navy-950' : 'bg-slate-100 text-slate-500'/g, "active ? 'bg-solar-400 text-navy-950' : 'bg-slate-200/50 text-slate-500'");
  
  content = content.replace(/className={`px-4 py-2\.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 min-h-\[44px\] \${/g, "className={`px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] ${");
  content = content.replace(/active\s+\?\s+'border-solar-400 bg-solar-400 text-navy-950'\s+:\s+'border-slate-200 bg-white text-slate-600 hover:border-slate-300'/g, "active ? 'border-navy-950 bg-navy-950 text-white' : 'bg-transparent text-navy-800 hover:border-navy-950'");

  content = content.replace(/<p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{label}<\/p>/g, '<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</p>');
  content = content.replace(/<span className="block text-sm font-semibold text-navy-900">Preferred Time/g, '<span className="block text-[10px] font-bold tracking-widest uppercase text-navy-950">Preferred Time');

  content = content.replace(/<div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">/g, '<div className="bg-white border border-slate-200 p-6 mt-12">');
  content = content.replace(/<p className="text-xs font-bold uppercase tracking-widest text-slate-400">Booking Summary<\/p>/g, '<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Summary</p>');
  content = content.replace(/<p className="text-slate-400 text-xs">{label}<\/p>/g, '<p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">{label}</p>');
  content = content.replace(/<p className="text-navy-900 font-semibold truncate">/g, '<p className="text-navy-950 font-medium truncate">');
  
  content = content.replace(/error=\{errors.email\}>/g, "error={errors.email} optional>");
  content = content.replace(/error=\{errors.address\}>/g, "error={errors.address} optional>");
  content = content.replace(/error=\{errors.notes\}>/g, "error={errors.notes} optional>");
  content = content.replace(/error=\{errors.monthly_bill\}>/g, "error={errors.monthly_bill} optional>");
  content = content.replace(/error=\{errors.system_size_kw\}>/g, "error={errors.system_size_kw} optional>");
  content = content.replace(/error=\{errors.installation_year\}>/g, "error={errors.installation_year} optional>");
  content = content.replace(/error=\{errors.roof_type\}>/g, "error={errors.roof_type} optional>");
  content = content.replace(/error=\{errors.property_age_years\}>/g, "error={errors.property_age_years} optional>");
  content = content.replace(/error=\{errors.roof_area_sqm\}>/g, "error={errors.roof_area_sqm} optional>");

  fs.writeFileSync(filePath, content);
}

transformFile('app/booking/maintenance/page.tsx', 'O&M SERVICE', 'Maintenance.', 'MAINTENANCE');
transformFile('app/booking/site-assessment/page.tsx', 'ON-SITE SURVEY', 'Assessment.', 'SITE ASSESSMENT');
