'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, Clock } from 'lucide-react';
import { LOCATIONS } from '@/data/locations';
import { createBookingAction, type ConsultationFormData } from '../actions';
import BookingSplitLayout from '../_components/BookingSplitLayout';
import {
  CONSULTATION_DURATION_OPTIONS,
  CONSULTATION_HOURLY_CENTAVOS,
  formatCentavos,
} from '@/lib/bookings/pricing';
import { Button } from '@/components/ui/Button';
import { Field, FieldError, Input, Select, Textarea } from '@/components/ui/Field';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

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

function Optional({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children} <span className="font-normal text-fg-subtle">(optional)</span>
    </>
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
    <div className="space-y-6">
      <h2 className="mb-8 text-h2 text-fg">Your details.</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="name" label="Full Name" error={errors.name} required>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </Field>
        <Field id="phone" label="Phone Number" error={errors.phone} required>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="09XX XXX XXXX"
            value={formData.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </Field>
      </div>

      <Field id="email" label={<Optional>Email Address</Optional>} error={errors.email}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="juan@email.com"
          value={formData.email}
          onChange={(e) => update('email', e.target.value)}
        />
      </Field>

      <Field id="city" label="City / Municipality" error={errors.city} required>
        <Select value={formData.city} onChange={(e) => handleCityChange(e.target.value)}>
          <option value="">Select your city</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}{c.province ? ` — ${c.province}` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="address"
        label={<Optional>Street Address</Optional>}
        error={errors.address}
        hint="Building, street, barangay — anything that helps our engineer find you."
      >
        <Textarea
          placeholder="Barangay, street, building"
          value={formData.address}
          onChange={(e) => update('address', e.target.value)}
          rows={2}
          className="resize-none"
        />
      </Field>
    </div>
  );
}

function Step3({ formData, errors, update }: StepProps) {
  const morningSlots = TIME_SLOTS.filter((t) => t.group === 'Morning');
  const afternoonSlots = TIME_SLOTS.filter((t) => t.group === 'Afternoon');

  const renderSlotGroup = (label: string, slots: typeof TIME_SLOTS) => (
    <div>
      <p className="mb-3 text-xs font-semibold text-fg-subtle">{label}</p>
      <div className="flex flex-wrap gap-3">
        {slots.map(({ label: time }) => {
          const active = formData.preferred_time === time;
          return (
            <button
              key={time}
              type="button"
              onClick={() => update('preferred_time', time)}
              aria-pressed={active}
              className={cn(
                'min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors duration-200',
                active
                  ? 'border-navy-950 bg-navy-950 text-white'
                  : 'border-slate-300 bg-white text-fg hover:border-navy-950',
              )}
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
      <h2 className="text-h2 text-fg">Schedule.</h2>

      <Field id="preferred_date" label="Preferred Date" error={errors.preferred_date} required>
        <Input
          type="date"
          min={minDate}
          max={maxDate}
          value={formData.preferred_date}
          onChange={(e) => update('preferred_date', e.target.value)}
        />
      </Field>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-fg">Session length</legend>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {CONSULTATION_DURATION_OPTIONS.map((hrs) => {
            const active = formData.duration_hours === String(hrs);
            return (
              <button
                key={hrs}
                type="button"
                onClick={() => update('duration_hours', String(hrs))}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-control border-2 p-4 transition-colors duration-200 sm:p-5',
                  active ? 'border-solar-500 bg-solar-50' : 'border-line bg-white hover:border-slate-300',
                )}
              >
                <span className={cn('font-display text-h2 tabular-nums', active ? 'text-fg' : 'text-fg-subtle')}>
                  {hrs}
                </span>
                <span className="text-xs text-fg-subtle">{hrs === 1 ? 'hour' : 'hours'}</span>
                <span className={cn('mt-1 text-sm font-semibold tabular-nums', active ? 'text-fg' : 'text-fg-muted')}>
                  {formatCentavos(CONSULTATION_HOURLY_CENTAVOS * hrs)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-fg-subtle">
          Paid online consultation at {formatCentavos(CONSULTATION_HOURLY_CENTAVOS)}/hour. Your slot is confirmed after payment.
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
          <Clock className="size-4 text-fg-subtle" aria-hidden />
          Preferred time
        </legend>
        <div className="space-y-6">
          {renderSlotGroup('Morning', morningSlots)}
          {renderSlotGroup('Afternoon', afternoonSlots)}
        </div>
        <FieldError className="mt-3">{errors.preferred_time}</FieldError>
      </fieldset>

      {/* Summary review */}
      <div className="mt-10 rounded-card border border-line bg-navy-50 p-6 sm:p-8">
        <h3 className="mb-4 text-title text-fg">Summary</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-base">
          <SummaryRow label="Name" value={formData.name} />
          <SummaryRow label="Phone" value={formData.phone} />
          <SummaryRow label="City" value={formData.city_name} />
          <SummaryRow label="Session" value={`${formData.duration_hours} ${formData.duration_hours === '1' ? 'hour' : 'hours'}`} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-navy-100 pt-6">
          <span className="text-sm font-semibold text-fg-muted">Total due</span>
          <span className="font-display text-h3 tabular-nums text-fg">
            {formatCentavos(CONSULTATION_HOURLY_CENTAVOS * Number(formData.duration_hours || 1))}
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-fg-muted">{label}</p>
      <p className="truncate font-medium text-fg">{value || '—'}</p>
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
    <BookingSplitLayout leftTitle="Consultation.">
      <div className="flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16">
        <Link
          href="/booking"
          className="mb-10 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All services
        </Link>

        {/* Progress */}
        <ol className="mb-12 flex gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex flex-1 flex-col gap-2" aria-current={active ? 'step' : undefined}>
                <div
                  className={cn(
                    'h-1 rounded-full transition-colors duration-300',
                    done ? 'bg-solar-500' : active ? 'bg-navy-950' : 'bg-slate-200',
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    active ? 'text-fg' : done ? 'text-solar-ink' : 'text-fg-subtle',
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

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
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {step === 0 && <Step1 formData={formData} errors={errors} update={update} />}
              {step === 1 && <Step3 formData={formData} errors={errors} update={update} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-12 border-t border-line pt-8">
          <FieldError role="alert" className="mt-0 mb-6 rounded-control bg-red-50 px-4 py-3">
            {submitError}
          </FieldError>
          <div className={cn('flex items-center gap-4', step > 0 ? 'justify-between' : 'justify-end')}>
            {step > 0 && (
              <Button variant="ghost" onClick={goBack} disabled={isSubmitting}>
                <ChevronLeft className="size-4" aria-hidden />
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button size="lg" onClick={goNext}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button size="lg" onClick={handleSubmit} loading={isSubmitting}>
                {isSubmitting ? (
                  'Redirecting…'
                ) : (
                  <>
                    Proceed to payment
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </BookingSplitLayout>
  );
}
