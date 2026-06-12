const fs = require('fs');

function increaseFormSize(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update inputClass
  content = content.replace(
    /const inputClass =\s+'w-full py-2 border-0 border-b border-slate-300 bg-transparent text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-sm min-h-\[44px\] px-0 rounded-none';/,
    "const inputClass =\n  'w-full py-4 border-0 border-b-2 border-slate-300 bg-transparent text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-lg min-h-[56px] px-0 rounded-none';"
  );

  // Update selectClass
  content = content.replace(
    /const selectClass =\s+'w-full py-2 pr-8 border-0 border-b border-slate-300 bg-transparent text-navy-900 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-sm appearance-none min-h-\[44px\] cursor-pointer px-0 rounded-none';/,
    "const selectClass =\n  'w-full py-4 pr-10 border-0 border-b-2 border-slate-300 bg-transparent text-navy-900 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-lg appearance-none min-h-[56px] cursor-pointer px-0 rounded-none';"
  );

  // Update FormField labels
  content = content.replace(
    /className="block text-\[10px\] font-bold tracking-widest uppercase text-navy-950"/g,
    'className="block text-xs font-bold tracking-widest uppercase text-navy-950"'
  );

  // Update property/issue button grids
  content = content.replace(
    /className={`flex items-start gap-4 p-5 border-2 text-left transition-all duration-200 min-h-\[44px\]/g,
    "className={`flex items-start gap-4 p-6 border-2 text-left transition-all duration-200 min-h-[60px]"
  );
  
  // Make property/issue button labels bigger
  content = content.replace(
    /<p className={`text-sm font-semibold \${active \? 'text-navy-900' : 'text-slate-600'}`}>{label}<\/p>/g,
    '<p className={`text-base font-semibold ${active ? \'text-navy-900\' : \'text-slate-600\'}`}>{label}</p>'
  );

  // Make property/issue button descriptions bigger
  content = content.replace(
    /<p className="text-xs text-slate-400 mt-1 leading-snug">{desc}<\/p>/g,
    '<p className="text-sm text-slate-400 mt-1 leading-snug">{desc}</p>'
  );

  fs.writeFileSync(filePath, content);
}

increaseFormSize('app/booking/consultation/page.tsx');
increaseFormSize('app/booking/maintenance/page.tsx');
increaseFormSize('app/booking/site-assessment/page.tsx');
