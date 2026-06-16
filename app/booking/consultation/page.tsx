'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';
import { LOCATIONS } from '@/data/locations';
import { createBookingAction, type ConsultationFormData } from '../actions';
import BookingSplitLayout from '../_components/BookingSplitLayout';
import {
  CONSULTATION_DURATION_OPTIONS,
  CONSULTATION_HOURLY_CENTAVOS,
  formatCentavos,
} from '@/lib/bookings/pricing';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Your details', 'Schedule'];

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
  'w-full py-3 border-0 border-b border-slate-300 bg-transparent text-navy-900 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-solar-400 transition-colors text-base min-h-[52px] px-0 rounded-none';

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
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy-800">
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
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-slate-400">
          <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

type StepProps = {
  formData: ConsultationFormData;
  errors: Partial<Record<keyof ConsultationFormData, string>>;
  update: (field: keyof ConsultationFormData, value: string) => void;
};

function Step1({ formData, errors, update }: StepProps) {
  const handleCityChange = (slug: string) => {
    const loc = cities.find((c) => c.slug === slug);
    update('city', slug);
    update('city_name', loc?.name ?? slug);
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-[2.25rem] font-black text-navy-950 tracking-tight text-wrap-balance" style={{ fontFamily: 'Poppins, sans-serif' }}>Your details.</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <FormField label="Full Name" htmlFor="name" error={errors.name}>
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
        <FormField label="Phone Number" htmlFor="phone" error={errors.phone}>
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
          placeholder="juan@email.com"
          value={formData.email}
          onChange={(e) => update('email', e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="City / Municipality" htmlFor="city" error={errors.city}>
        <SelectWrapper>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your city</option>
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
          placeholder="Barangay, street, building"
          value={formData.address}
          onChange={(e) => update('address', e.target.value)}
          rows={1}
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-slate-400 mt-2 italic">Building, street, barangay — anything that helps our engineer find you.</p>
      </FormField>
    </div>
  );
}

function Step3({ formData, errors, update }: StepProps) {
  const morningSlots = TIME_SLOTS.filter((t) => t.group === 'Morning');
  const afternoonSlots = TIME_SLOTS.filter((t) => t.group === 'Afternoon');

  const renderSlotGroup = (label: string, slots: typeof TIME_SLOTS) => (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-3">{label}</p>
      <div className="flex flex-wrap gap-3">
        {slots.map(({ label: time }) => {
          const active = formData.preferred_time === time;
          return (
            <button
              key={time}
              type="button"
              onClick={() => update('preferred_time', time)}
              aria-pressed={active}
              className={`px-6 py-3 rounded-full border border-slate-300 text-sm font-semibold tracking-wide transition-all duration-200 min-h-[52px] ${
                active
                  ? 'border-navy-950 bg-navy-950 text-white'
                  : 'bg-transparent text-navy-800 hover:border-navy-950'
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
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-[2.25rem] font-black text-navy-950 tracking-tight text-wrap-balance" style={{ fontFamily: 'Poppins, sans-serif' }}>Schedule.</h2>
      </div>

      <FormField label="Preferred Date" htmlFor="preferred_date" error={errors.preferred_date}>
        <div className="relative">
          <Calendar size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="preferred_date"
            type="date"
            min={minDate}
            max={maxDate}
            value={formData.preferred_date}
            onChange={(e) => update('preferred_date', e.target.value)}
            className={`${inputClass} pl-8`}
          />
        </div>
      </FormField>

      <div>
        <p className="block text-sm font-semibold text-navy-800 mb-3">Session length</p>
        <div className="grid grid-cols-3 gap-4">
          {CONSULTATION_DURATION_OPTIONS.map((hrs) => {
            const active = formData.duration_hours === String(hrs);
            return (
              <button
                key={hrs}
                type="button"
                onClick={() => update('duration_hours', String(hrs))}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 p-5 border-2 transition-all duration-200 min-h-[52px] ${
                  active ? 'border-solar-400 bg-white' : 'border-slate-200/60 bg-transparent hover:border-slate-300'
                }`}
              >
                <span className={`text-3xl font-black ${active ? 'text-navy-950' : 'text-slate-300'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>{hrs}</span>
                <span className="text-xs text-slate-400">{hrs === 1 ? 'hour' : 'hours'}</span>
                <span className={`text-sm font-semibold mt-1 ${active ? 'text-navy-900' : 'text-slate-400'}`}>
                  {formatCentavos(CONSULTATION_HOURLY_CENTAVOS * hrs)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2 italic">
          Paid online consultation at {formatCentavos(CONSULTATION_HOURLY_CENTAVOS)}/hour. Your slot is confirmed after payment.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-400" />
          <span className="block text-sm font-semibold text-navy-800">Preferred time</span>
        </div>
        <div className="space-y-6">
          {renderSlotGroup('Morning', morningSlots)}
          {renderSlotGroup('Afternoon', afternoonSlots)}
        </div>
        {errors.preferred_time && (
          <p className="text-red-500 text-xs mt-2" role="alert">{errors.preferred_time}</p>
        )}
      </div>

      {/* Summary review */}
      <div className="bg-white border border-slate-200 p-8 mt-12">
        <p className="text-sm font-semibold text-slate-500 mb-4">Summary</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-base">
          <SummaryRow label="Name" value={formData.name} />
          <SummaryRow label="Phone" value={formData.phone} />
          <SummaryRow label="City" value={formData.city_name} />
          <SummaryRow label="Session" value={`${formData.duration_hours} ${formData.duration_hours === '1' ? 'hour' : 'hours'}`} />
        </div>
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <span className="text-xs font-semibold text-slate-400">Total due</span>
          <span className="text-2xl font-black text-navy-950" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatCentavos(CONSULTATION_HOURLY_CENTAVOS * Number(formData.duration_hours || 1))}
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-navy-950 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultationBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ConsultationFormData, string>>>({});
  const [formData, setFormData] = useState<ConsultationFormData>({
    name: '',
    phone: '',
    email: '',
    city: '',
    city_name: '',
    address: '',
    service_type: '',
    property_type: '',
    monthly_bill: '',
    notes: '',
    preferred_date: '',
    preferred_time: '',
    duration_hours: '1',
  });

  const update = (field: keyof ConsultationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const next: Partial<Record<keyof ConsultationFormData, string>> = {};
    if (step === 0) {
      if (!formData.name.trim()) next.name = 'Full name is required.';
      if (!formData.phone.trim()) next.phone = 'Phone number is required.';
      if (!formData.city) next.city = 'Please select your city.';
    } else if (step === 1) {
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
    const result = await createBookingAction({ ...formData, booking_type: 'consultation' });
    if ('error' in result) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    // Paid consultation → send to checkout (PayMongo or stub). Keep the
    // spinner on during the redirect so the button can't be double-fired.
    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    setIsSubmitting(false);
    router.push(`/booking/confirmation?id=${result.bookingId}&name=${encodeURIComponent(formData.name)}`);
  };

  return (
    <BookingSplitLayout
      leftTag="CONSULTATION"
      leftTitle="Consultation."
    >
      <div className="flex-1 p-6 sm:p-12 lg:p-16 xl:p-24 max-w-3xl w-full mx-auto lg:mx-0 flex flex-col">
        <Link href="/booking" className="inline-flex items-center gap-2 text-slate-400 hover:text-navy-950 transition-colors text-sm font-medium mb-12 w-fit">
          <ChevronLeft size={16} />
          Back to index
        </Link>

        {/* Progress */}
        <div className="flex gap-2 mb-14">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex-1 flex flex-col gap-2.5">
                <div className={`h-[3px] rounded-sm transition-all duration-300 ${
                  done ? 'bg-solar-400' : active ? 'bg-navy-950' : 'bg-slate-200'
                }`} />
                <span className={`text-[11px] font-semibold transition-colors ${
                  active ? 'text-navy-950' : done ? 'text-solar-500' : 'text-slate-300'
                }`}>
                  {label}
                </span>
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
              {step === 1 && <Step3 formData={formData} errors={errors} update={update} />}
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
                className="flex items-center gap-2 text-slate-400 hover:text-navy-950 font-semibold text-base transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-3 px-10 py-4 rounded-full bg-solar-500 text-navy-950 font-bold text-sm tracking-wide hover:bg-solar-400 transition-colors min-h-[52px]"
              >
                CONTINUE
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-3 px-10 py-4 rounded-full bg-solar-500 text-navy-950 font-bold text-sm tracking-wide hover:bg-solar-400 transition-colors min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    REDIRECTING…
                  </>
                ) : (
                  <>
                    PROCEED TO PAYMENT
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
