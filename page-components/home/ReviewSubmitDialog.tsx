'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, Loader2, MessageSquarePlus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-solar-400 focus:ring-2 focus:ring-solar-400/20 focus:bg-white transition-all duration-300';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-1.5';

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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus size={20} className="text-solar-500" />
                  <h2 className="text-lg font-bold text-navy-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Share Your Experience
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6">
                {succeeded ? (
                  /* Success state */
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-green-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Thank you for your review!
                    </h3>
                    <p className="text-green-700 text-sm mb-6">
                      Your feedback has been submitted and is pending approval.
                    </p>
                    <button
                      onClick={handleClose}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                        {error}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className={LABEL_CLASS}>
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className={LABEL_CLASS}>Company Name <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company or business"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Contact preference */}
                    <div>
                      <label className={LABEL_CLASS}>
                        Contact Preference <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {(['email', 'phone'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setContactType(type);
                              setContactValue('');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
                              contactType === type
                                ? 'bg-navy-900 text-white font-bold'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {type === 'email' ? 'Email' : 'Phone'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contact value */}
                    <div>
                      <label className={LABEL_CLASS}>
                        {contactType === 'email' ? 'Email Address' : 'Phone Number'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={contactType === 'email' ? 'email' : 'tel'}
                        required
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value)}
                        placeholder={contactType === 'email' ? 'your@email.com' : '09XX XXX XXXX'}
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Star rating */}
                    <div>
                      <label className={LABEL_CLASS}>
                        Rating <span className="text-red-500">*</span>
                      </label>
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
                              className="transition-transform hover:scale-110 focus:outline-none"
                              aria-label={`Rate ${star} out of 5`}
                            >
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill={filled ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className={filled ? 'text-solar-500' : 'text-slate-300'}
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
                        <span className="ml-2 text-sm text-slate-500 self-center">
                          {displayRating} / 5
                        </span>
                      </div>
                    </div>

                    {/* Quote / Review */}
                    <div>
                      <label className={LABEL_CLASS}>
                        Your Review <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Tell us about your experience with JMC Solar..."
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-navy-900 hover:bg-navy-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
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
