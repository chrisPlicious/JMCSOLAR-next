'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Home,
  Building2,
  Factory,
  Leaf,
  Calendar,
  Clock,
} from 'lucide-react';
import { LOCATIONS } from '@/data/locations';
import BookingSplitLayout from '../_components/BookingSplitLayout';
import Link from 'next/link';
import { createBookingAction, type SiteAssessmentFormData } from '../actions';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Personal Info', 'Property Details', 'Schedule'];

const PROPERTY_TYPES = [
  { value: 'residential', label: 'Residential', desc: 'Home or house', Icon: Home },
  { value: 'commercial', label: 'Commercial', desc: 'Office, store, or resto', Icon: Building2 },
  { value: 'industrial', label: 'Industrial', desc: 'Factory or warehouse', Icon: Factory },
  { value: 'agricultural', label: 'Agricultural', desc: 'Farm or agricultural land', Icon: Leaf },
];

const ROOF_TYPES = [
  'Metal sheet (G.I.)',
  'Concrete slab',
  'Clay tile',
  'Asphalt shingle',
  'Other',
];

const PROPERTY_AGE_RANGES = [
  'Less than 5 years',
  '5–10 years',
  '10–20 years',
  'More than 20 years',
];

const MONTHLY_BILLS = [
  'Below ₱2,000',
  '₱2,000 – ₱5,000',
  '₱5,000 – ₱10,000',
  '₱10,000 – ₱20,000',
  'Above ₱20,000',
  'Not sure',
];

const TIME_SLOTS = [
  { label: '9:00 AM', group: 'Morning' },
  { label: '10:00 AM', group: 'Morning' },
  { label: '11:00 AM', group: 'Morning' },
  { label: '1:00 PM', group: 'Afternoon' },
  { label: '2:00 PM', group: 'Afternoon' },
  { label: '3:00 PM', group: 'Afternoon' },
  { label: '4:00 PM', group: 'Afternoon' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  'w-full py-3 border-0 border-b border-slate-300 bg-transparent text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-base min-h-[52px] px-0 rounded-none';

const selectClass =
  'w-full py-3 pr-8 border-0 border-b border-slate-300 bg-transparent text-navy-900 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-base appearance-none min-h-[52px] cursor-pointer px-0 rounded-none';

// ─── Derived data ─────────────────────────────────────────────────────────────

const cities = LOCATIONS.filter((l) => l.tier === 'municipality').sort((a, b) =>
  a.name.localeCompare(b.name),
);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const minDate = tomorrow.toISOString().split('T')[0];
const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// ─── Animation ────────────────────────────────────────────────────────────────

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({
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
        <label htmlFor={htmlFor} className="block text-xs font-bold tracking-widest uppercase text-navy-950">
          {label}
        </label>
        {optional && <span className="text-xs italic text-slate-400">optional</span>}
      </div>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5" role="alert">{error}</p>}
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-slate-400">
          <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

type StepProps = {
  formData: SiteAssessmentFormData;
  errors: Partial<Record<keyof SiteAssessmentFormData, string>>;
  update: (field: keyof SiteAssessmentFormData, value: string) => void;
};

function Step1({ formData, errors, update }: StepProps) {
  const handleCityChange = (slug: string) => {
    const loc = cities.find((c) => c.slug === slug);
    update('city', slug);
    update('city_name', loc?.name ?? slug);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-solar-500 uppercase mb-3">Step 1 of 3 · SITE ASSESSMENT</p>
        <h2 className="font-serif text-5xl text-navy-950 tracking-tight">Personal Information.</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <FormField label="Full Name *" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Phone Number *" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="09XX XXX XXXX"
            value={formData.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField label="Email Address" htmlFor="email" error={errors.email} optional>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="juan@email.com "
          value={formData.email}
          onChange={(e) => update('email', e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="City / Municipality *" htmlFor="city" error={errors.city}>
        <SelectWrapper>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your city...</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}{c.province ? ` — ${c.province}` : ''}
              </option>
            ))}
          </select>
        </SelectWrapper>
      </FormField>

      <FormField label="Street Address" htmlFor="address" error={errors.address} optional>
        <textarea
          id="address"
          placeholder="Barangay, Street, Building "
          value={formData.address}
          onChange={(e) => update('address', e.target.value)}
          rows={2}
          className={`${inputClass} min-h-[76px] resize-none`}
        />
      </FormField>
    </div>
  );
}

function Step2({ formData, errors, update }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-solar-500 uppercase mb-3">Step 2 of 3 · SITE ASSESSMENT</p>
        <h2 className="font-serif text-5xl text-navy-950 tracking-tight">Property Details.</h2>
      </div>

      <div>
        <p className="block text-xs font-bold tracking-widest uppercase text-navy-950 mb-3">Property Type *</p>
        <div className="grid grid-cols-2 gap-4">
          {PROPERTY_TYPES.map(({ value, label, desc, Icon }) => {
            const active = formData.property_type === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update('property_type', value)}
                className={`flex items-start gap-4 p-6 border-2 text-left transition-all duration-200 min-h-[52px] ${
                  active ? 'border-solar-400 bg-white' : 'border-slate-200/60 bg-transparent hover:border-slate-300'
                }`}
                aria-pressed={active}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${active ? 'bg-solar-400 text-navy-950' : 'bg-slate-200/50 text-slate-500'}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className={`text-base font-semibold ${active ? 'text-navy-900' : 'text-slate-700'}`}>{label}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-snug">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.property_type && (
          <p className="text-red-500 text-xs mt-1.5" role="alert">{errors.property_type}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Roof Type" htmlFor="roof_type" error={errors.roof_type} optional>
          <SelectWrapper>
            <select
              id="roof_type"
              value={formData.roof_type}
              onChange={(e) => update('roof_type', e.target.value)}
              className={selectClass}
            >
              <option value="">Select roof type ...</option>
              {ROOF_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </SelectWrapper>
        </FormField>

        <FormField label="Property Age" htmlFor="property_age_years" error={errors.property_age_years} optional>
          <SelectWrapper>
            <select
              id="property_age_years"
              value={formData.property_age_years}
              onChange={(e) => update('property_age_years', e.target.value)}
              className={selectClass}
            >
              <option value="">Select age range ...</option>
              {PROPERTY_AGE_RANGES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </SelectWrapper>
        </FormField>
      </div>

      <FormField label="Available Roof Area (sqm)" htmlFor="roof_area_sqm" error={errors.roof_area_sqm} optional>
        <input
          id="roof_area_sqm"
          type="text"
          inputMode="decimal"
          placeholder="Approximate available roof area in sqm "
          value={formData.roof_area_sqm}
          onChange={(e) => update('roof_area_sqm', e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Approximate Monthly Electric Bill" htmlFor="monthly_bill" error={errors.monthly_bill} optional>
        <SelectWrapper>
          <select
            id="monthly_bill"
            value={formData.monthly_bill}
            onChange={(e) => update('monthly_bill', e.target.value)}
            className={selectClass}
          >
            <option value="">Select range ...</option>
            {MONTHLY_BILLS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </SelectWrapper>
      </FormField>
    </div>
  );
}

function Step3({ formData, errors, update }: StepProps) {
  const morningSlots = TIME_SLOTS.filter((t) => t.group === 'Morning');
  const afternoonSlots = TIME_SLOTS.filter((t) => t.group === 'Afternoon');

  const renderSlotGroup = (label: string, slots: typeof TIME_SLOTS) => (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {slots.map(({ label: time }) => {
          const active = formData.preferred_time === time;
          return (
            <button
              key={time}
              type="button"
              onClick={() => update('preferred_time', time)}
              aria-pressed={active}
              className={`px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] ${
                active ? 'border-navy-950 bg-navy-950 text-white' : 'bg-transparent text-navy-800 hover:border-navy-950'
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-solar-500 uppercase mb-3">Step 3 of 3 · SITE ASSESSMENT</p>
        <h2 className="font-serif text-4xl text-navy-950 tracking-tight">Preferred Schedule.</h2>
      </div>

      <FormField label="Preferred Date *" htmlFor="preferred_date" error={errors.preferred_date}>
        <div className="relative">
          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="preferred_date"
            type="date"
            min={minDate}
            max={maxDate}
            value={formData.preferred_date}
            onChange={(e) => update('preferred_date', e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </FormField>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-slate-400" />
          <span className="block text-xs font-bold tracking-widest uppercase text-navy-950">Preferred Time *</span>
        </div>
        <div className="space-y-4">
          {renderSlotGroup('Morning', morningSlots)}
          {renderSlotGroup('Afternoon', afternoonSlots)}
        </div>
        {errors.preferred_time && (
          <p className="text-red-500 text-xs mt-2" role="alert">{errors.preferred_time}</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white border border-slate-200 p-6 mt-12">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Summary</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <SummaryRow label="Name" value={formData.name} />
          <SummaryRow label="Phone" value={formData.phone} />
          <SummaryRow label="City" value={formData.city_name} />
          {formData.property_type && (
            <SummaryRow
              label="Property"
              value={formData.property_type.charAt(0).toUpperCase() + formData.property_type.slice(1)}
            />
          )}
          {formData.roof_type && <SummaryRow label="Roof" value={formData.roof_type} />}
          {formData.monthly_bill && <SummaryRow label="Monthly Bill" value={formData.monthly_bill} />}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-navy-950 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteAssessmentBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof SiteAssessmentFormData, string>>>({});
  const [formData, setFormData] = useState<SiteAssessmentFormData>({
    name: '',
    phone: '',
    email: '',
    city: '',
    city_name: '',
    address: '',
    property_type: '',
    roof_type: '',
    property_age_years: '',
    roof_area_sqm: '',
    monthly_bill: '',
    preferred_date: '',
    preferred_time: '',
  });

  const update = (field: keyof SiteAssessmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const next: Partial<Record<keyof SiteAssessmentFormData, string>> = {};
    if (step === 0) {
      if (!formData.name.trim()) next.name = 'Full name is required.';
      if (!formData.phone.trim()) next.phone = 'Phone number is required.';
      if (!formData.city) next.city = 'Please select your city.';
    } else if (step === 1) {
      if (!formData.property_type) next.property_type = 'Please select a property type.';
    } else if (step === 2) {
      if (!formData.preferred_date) next.preferred_date = 'Please select a date.';
      if (!formData.preferred_time) next.preferred_time = 'Please select a time slot.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    setSubmitError('');
    const result = await createBookingAction({ ...formData, booking_type: 'site_assessment' });
    setIsSubmitting(false);
    if ('error' in result) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/booking/confirmation?id=${result.bookingId}&name=${encodeURIComponent(formData.name)}`);
  };

  const progressPercent = (step / (STEPS.length - 1)) * 100;

  return (
    <BookingSplitLayout
      leftTag="ON-SITE SURVEY"
      leftTitle="Assessment."
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
              <div key={i} className={`relative bg-[#FBF9F6] px-3 sm:px-4 flex items-center gap-2 transition-colors ${active ? 'text-navy-950' : done ? 'text-slate-400' : 'text-slate-300'}`}>
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
          <div className={`flex gap-4 items-center ${step > 0 ? 'justify-between' : 'justify-end'}`}>
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
  );
}
