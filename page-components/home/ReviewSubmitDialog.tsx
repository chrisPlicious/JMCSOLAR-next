'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '@/lib/motion';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_LABEL_CLASS = 'mb-1.5 block text-sm font-semibold text-fg';

export default function ReviewSubmitDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setName('');
      setCompanyName('');
      setContactType('email');
      setContactValue('');
      setRating(5);
      setHoverRating(0);
      setQuote('');
      setSubmitting(false);
      setSucceeded(false);
      setError('');
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company_name: companyName || undefined,
          contact_type: contactType,
          contact_value: contactValue,
          rating,
          quote,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setSucceeded(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            onClick={handleClose}
          />

          {/* Modal container */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-dialog-title"
              className="pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-white shadow-elevated"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus size={20} className="text-solar-ink" aria-hidden />
                  <h2 id="review-dialog-title" className="text-h3 text-fg">
                    Share Your Experience
                  </h2>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close">
                  <X size={18} aria-hidden />
                </Button>
              </div>

              <div className="px-6 py-6">
                {succeeded ? (
                  /* Success state */
                  <div className="rounded-card border border-green-200 bg-green-eco-bg p-8 text-center">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-eco" aria-hidden />
                    <h3 className="mb-2 text-h3 text-green-800">Thank you for your review!</h3>
                    <p className="mb-6 text-sm text-green-800">
                      Your feedback has been submitted and is pending approval.
                    </p>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div role="alert" className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <Field id="review-name" label="Name" required>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Juan dela Cruz"
                      />
                    </Field>

                    <Field
                      id="review-company"
                      label={
                        <>
                          Company Name <span className="font-normal text-fg-subtle">(optional)</span>
                        </>
                      }
                    >
                      <Input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company or business"
                      />
                    </Field>

                    {/* Contact preference */}
                    <div role="group" aria-labelledby="review-contact-pref">
                      <p id="review-contact-pref" className={GROUP_LABEL_CLASS}>
                        Contact Preference <span className="ml-0.5 text-red-600" aria-hidden>*</span>
                      </p>
                      <div className="flex gap-2">
                        {(['email', 'phone'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={contactType === type}
                            onClick={() => {
                              setContactType(type);
                              setContactValue('');
                            }}
                            className={cn(
                              'cursor-pointer rounded-full px-4 py-2 text-sm transition-colors',
                              contactType === type
                                ? 'bg-navy-900 font-bold text-white'
                                : 'bg-slate-100 font-medium text-fg-muted hover:bg-slate-200',
                            )}
                          >
                            {type === 'email' ? 'Email' : 'Phone'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field
                      id="review-contact"
                      label={contactType === 'email' ? 'Email Address' : 'Phone Number'}
                      required
                    >
                      <Input
                        type={contactType === 'email' ? 'email' : 'tel'}
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value)}
                        placeholder={contactType === 'email' ? 'your@email.com' : '09XX XXX XXXX'}
                      />
                    </Field>

                    {/* Star rating */}
                    <div role="group" aria-labelledby="review-rating-label">
                      <p id="review-rating-label" className={GROUP_LABEL_CLASS}>
                        Rating <span className="ml-0.5 text-red-600" aria-hidden>*</span>
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = star <= displayRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="cursor-pointer rounded-md transition-transform duration-150 hover:scale-110"
                              aria-label={`Rate ${star} out of 5`}
                              aria-pressed={star === rating}
                            >
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill={filled ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                aria-hidden
                                className={filled ? 'text-solar-500' : 'text-slate-500'}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                              </svg>
                            </button>
                          );
                        })}
                        <span className="ml-2 self-center text-sm text-fg-subtle tabular-nums">
                          {displayRating} / 5
                        </span>
                      </div>
                    </div>

                    <Field id="review-quote" label="Your Review" required>
                      <Textarea
                        rows={4}
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Tell us about your experience with JMC Solar..."
                        className="resize-none"
                      />
                    </Field>

                    <Button type="submit" variant="secondary" fullWidth loading={submitting}>
                      {submitting ? 'Submitting...' : 'Submit review'}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
