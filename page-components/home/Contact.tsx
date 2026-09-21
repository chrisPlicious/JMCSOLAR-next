'use client';

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Send, Clock, CreditCard } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getMunicipalityLocations } from "@/data/locations";
import { FACEBOOK_URL } from "@/lib/seo/site";
import { DURATION, EASE_OUT, fadeUp, revealOnScroll, stagger } from "@/lib/motion";

const systemTypes = [
  "Hybrid Solar System",
  "On-Grid / Net-Metered Solar",
  "Battery Energy Storage (BESS)",
  "Solar Pumping System",
  "EV Charger Installation",
  "UPS System",
  "Solar Charge Controller",
  "Not sure — need consultation",
];

const serviceToSystemType: Record<string, string> = {
  hybrid: "Hybrid Solar System",
  ongrid: "On-Grid / Net-Metered Solar",
  bess: "Battery Energy Storage (BESS)",
  pump: "Solar Pumping System",
  ev: "EV Charger Installation",
  ups: "UPS System",
  controller: "Solar Charge Controller",
};

const serviceToMessage: Record<string, string> = {
  hybrid:
    "Hi JMC Solar PH! I'd like to inquire about your Hybrid Solar System. I'm interested in getting a free site assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
  ongrid:
    "Hi JMC Solar PH! I'd like to inquire about your On-Grid / Net-Metered Solar System. I'm interested in getting a free site assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
  bess:
    "Hi JMC Solar PH! I'd like to inquire about your Battery Energy Storage System (BESS). I'm interested in getting a free assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
  pump:
    "Hi JMC Solar PH! I'd like to inquire about your Solar Pumping System. I'm interested in getting a free site assessment and quotation for my property. Please get in touch with me at your earliest convenience. Thank you!",
  ev:
    "Hi JMC Solar PH! I'd like to inquire about your EV Charger Installation service. I'm interested in getting a free assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
  ups:
    "Hi JMC Solar PH! I'd like to inquire about your UPS System. I'm interested in getting a free assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
  controller:
    "Hi JMC Solar PH! I'd like to inquire about your Solar Charge Controller. I'm interested in getting a free assessment and quotation. Please get in touch with me at your earliest convenience. Thank you!",
};

export default function Contact() {
  const searchParams = useSearchParams();

  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | null = null;
    let smoothCheckId: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (pollId) { clearInterval(pollId); pollId = null; }
      if (smoothCheckId) { clearTimeout(smoothCheckId); smoothCheckId = null; }
    };

    const scrollToContact = (behavior: ScrollBehavior = 'instant') => {
      clearTimers();
      const el = document.getElementById('contact');
      if (!el) return;

      const doScroll = (b: ScrollBehavior = behavior) => {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: b });
      };

      doScroll();

      if (behavior === 'instant') {
        // Cross-page: poll to correct for layout shifts (Firestore loading
        // in Reviews pushes Contact down). Re-scroll whenever the section
        // drifts from the target position. Stop after stable for 500 ms or 3 s.
        let attempts = 0;
        let stableCount = 0;
        pollId = setInterval(() => {
          attempts++;
          const rect = el.getBoundingClientRect();
          if (Math.abs(rect.top - 80) > 10) {
            doScroll();
            stableCount = 0;
          } else {
            stableCount++;
          }
          if (stableCount >= 5 || attempts >= 30) clearTimers();
        }, 100);
      } else {
        // Smooth scroll: verify position after the animation finishes
        smoothCheckId = setTimeout(() => {
          const rect = el.getBoundingClientRect();
          if (Math.abs(rect.top - 80) > 10) doScroll('instant');
        }, 800);
      }
    };

    // 1) Cross-page navigation or full page load with #contact hash
    if (window.location.hash === '#contact') {
      scrollToContact('instant');
    }

    // 2) Intercept clicks on any /#contact link while on the homepage.
    //    This prevents the browser's native hash scroll (which ignores
    //    the 80 px navbar offset) and Next.js <Link> router.push.
    //    Capture phase fires before React's event delegation.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.includes('#contact')) return;
      if (window.location.pathname !== '/') return;

      e.preventDefault();
      scrollToContact('smooth');
      window.history.pushState(null, '', href);
    };
    document.addEventListener('click', onClick, true);

    // 3) hashchange covers edge-cases (back/forward navigation, etc.)
    const onHashChange = () => {
      if (window.location.hash === '#contact') scrollToContact('smooth');
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      clearTimers();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const [formData, setFormData] = useState(() => {
    const productId = searchParams.get("product") ?? "";
    const foundProduct = products.find((p) => p.id === productId);

    const service =
      foundProduct?.relatedService ?? (searchParams.get("service") ?? "");
    const systemType = serviceToSystemType[service] ?? "";
    const message = foundProduct
      ? `Hi JMC Solar PH! I'd like to inquire about the ${foundProduct.name} (${foundProduct.specs}). Please provide availability and pricing information. Thank you!`
      : serviceToMessage[service] ?? "";

    return {
      name: "",
      phone: "",
      email: "",
      city: "",
      systemType,
      message,
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) setSucceeded(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Section id="contact" tone="tint" className="scroll-mt-20 overflow-hidden">
      <motion.div variants={fadeUp} {...revealOnScroll}>
        <SectionHeader
          title="Ready to Go Solar?"
          lead="Send us a message and our team will get back to you with a free consultation and system recommendation tailored to your needs."
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
        {/* Contact Info (left) */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h3 className="mb-6 text-h3 text-fg">Contact Information</h3>
            <motion.ul className="space-y-5" variants={stagger(0.07)} {...revealOnScroll}>
              <ContactItem icon={<Phone size={18} />} href="tel:+639175088220">
                0917 508 8220
              </ContactItem>
              <ContactItem icon={<Mail size={18} />} href="mailto:jmcsolarph@gmail.com">
                jmcsolarph@gmail.com
              </ContactItem>
              <ContactItem icon={<MapPin size={18} />}>
                Lilia Avenue, Cogon,
                <br />
                Ormoc City, Leyte 6541
                <br />
                Philippines
              </ContactItem>
              <ContactItem icon={<Facebook size={18} />} href={FACEBOOK_URL} external>
                JMC Solar PH on Facebook
              </ContactItem>
              <ContactItem icon={<Clock size={18} />}>
                Monday - Friday: 8:00 AM - 5:00 PM
              </ContactItem>
              <ContactItem icon={<CreditCard size={18} />}>
                We accept credit card payments and installment options
              </ContactItem>
            </motion.ul>
          </div>

          {/* Service Areas Box */}
          <Card as={motion.div} variant="dark" padding="md" variants={fadeUp} {...revealOnScroll}>
            <h3 className="mb-4 text-title text-fg">We Serve</h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-fg-muted">
              {getMunicipalityLocations().map((loc) => (
                <li key={loc.slug} className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-solar-500" aria-hidden />
                  <Link href={`/locations/${loc.slug}`} className="truncate transition-colors hover:text-fg">
                    {loc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Inquiry Form (right) */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {succeeded ? (
              <motion.div
                key="success"
                role="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                className="rounded-card border border-green-200 bg-green-eco-bg p-6 text-center sm:p-10"
              >
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white">
                  <Send size={28} className="text-green-eco" aria-hidden />
                </div>
                <h3 className="mb-2 text-h3 text-fg">Message Sent!</h3>
                <p className="text-fg-muted">
                  Thank you for reaching out. Our team will get back to you within
                  24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                onSubmit={handleSubmit}
                className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-7 lg:p-9"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="name" label="Full Name" required>
                    <Input
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Juan Dela Cruz"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Field>
                  <Field id="phone" label="Phone Number" required>
                    <Input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="09XX XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="email" label="Email Address">
                    <Input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="juan@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Field>
                  <Field id="city" label="City / Municipality">
                    <Input
                      name="city"
                      type="text"
                      placeholder="Ormoc City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </Field>
                </div>

                <Field id="systemType" label="System Type">
                  <Select name="systemType" value={formData.systemType} onChange={handleChange}>
                    <option value="">Select a service...</option>
                    {systemTypes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="message" label="Message">
                  <Textarea
                    name="message"
                    rows={4}
                    placeholder="Tell us about your property, current electricity bill, or any questions..."
                    value={formData.message}
                    onChange={handleChange}
                    className="resize-none"
                  />
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  className="send-btn overflow-hidden"
                >
                  {submitting ? (
                    "Sending..."
                  ) : (
                    <span className="inline-flex items-center">
                      <span className="send-fly">
                        <span className="send-icon">
                          <Send size={18} aria-hidden />
                        </span>
                      </span>
                      <span className="send-text">Send inquiry</span>
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-fg-subtle">
                  We respect your privacy. Your information will never be shared
                  with third parties.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map Embed */}
      <motion.div className="mt-16" variants={fadeUp} {...revealOnScroll}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-control bg-white text-solar-ink">
            <MapPin size={16} aria-hidden />
          </span>
          <span className="text-sm font-semibold text-fg">
            Find Us — Lilia Avenue, Cogon, Ormoc City, Leyte 6541
          </span>
        </div>
        <div className="overflow-hidden rounded-card border border-line shadow-soft">
          <iframe
            title="JMC Solar Ormoc on Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d788.1558470516892!2d124.60600752736785!3d11.016442895645005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3307f1ac0bb65341%3A0x5a61c31ee45ed6d3!2sJMC%20Solar%20Ormoc!5e1!3m2!1sen!2sph!4v1772197675888!5m2!1sen!2sph"
            className="h-[40vh] w-full border-0 sm:h-[55vh] lg:h-[70vh]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="mt-3 text-center text-xs text-fg-muted">
          Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fg"
          >
            OpenStreetMap
          </a>{" "}
          contributors · Lilia Avenue, Cogon, Ormoc City, Leyte 6541
        </p>
      </motion.div>
    </Section>
  );
}

function ContactItem({
  icon,
  href,
  external,
  children,
}: {
  icon: ReactNode;
  href?: string;
  external?: boolean;
  children: ReactNode;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-white text-solar-ink"
      >
        {icon}
      </span>
      <span className="text-sm text-fg-muted transition-colors group-hover:text-fg">{children}</span>
    </div>
  );

  return (
    <motion.li variants={fadeUp}>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="group block rounded-control"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </motion.li>
  );
}
