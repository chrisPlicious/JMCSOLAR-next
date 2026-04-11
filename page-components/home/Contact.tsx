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
import { Phone, Mail, MapPin, Facebook, Send, Clock, CreditCard } from "lucide-react";
import Button from "@/components/ui/Button";

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
    if (window.location.hash === '#contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
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
    <section id="contact" className="relative py-24 bg-warm overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-solar-600 font-semibold text-sm uppercase tracking-widest mb-5">
            <span className="w-8 h-px bg-solar-500" />
            Get Started
            <span className="w-8 h-px bg-solar-500" />
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Ready to <span className="text-solar-500">Go Solar?</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Send us a message and our team will get back to you with a free
            consultation and system recommendation tailored to your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Info (left) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <h3
                className="text-navy-900 font-bold text-xl mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Contact Information
              </h3>
              <ul className="space-y-5">
                <ContactItem icon={<Phone size={18} />} href="tel:+639175088220">
                  0917 508 8220
                </ContactItem>
                <ContactItem
                  icon={<Mail size={18} />}
                  href="mailto:jmcsolarph@gmail.com"
                >
                  jmcsolarph@gmail.com
                </ContactItem>
                <ContactItem icon={<MapPin size={18} />}>
                  Lilia Avenue, Cogon,
                  <br />
                  Ormoc City, Leyte 6541
                  <br />
                  Philippines
                </ContactItem>
                <ContactItem
                  icon={<Facebook size={18} />}
                  href="https://www.facebook.com/JMCSolarPH"
                  external
                >
                  JMC Solar PH on Facebook
                </ContactItem>
                <ContactItem icon={<Clock size={18} />}>
                  Monday - Friday: 8:00 AM - 5:00 PM
                </ContactItem>
                <ContactItem icon={<CreditCard size={18} />}>
                  We accept credit card payments and installment options
                </ContactItem>
              </ul>
            </div>

            {/* Service Areas Box */}
            <div className="bg-linear-to-br from-navy-900 to-navy-800 rounded-3xl p-6 text-white shadow-elevated">
              <h4
                className="font-semibold mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                We Serve
              </h4>
              <ul className="text-white/60 text-sm space-y-2">
                {[
                  "Ormoc City",
                  "Cebu Port Center",
                  "ZBO & Ipil",
                  "Eastern Visayas",
                  "All of Leyte",
                ].map((area) => (
                  <li key={area} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-solar-400 shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Inquiry Form (right) */}
          <div className="lg:col-span-3">
            {succeeded ? (
              <div className="bg-green-eco/8 border border-green-eco/20 rounded-3xl p-6 sm:p-10 text-center">
                <div className="w-16 h-16 bg-green-eco/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-green-eco" />
                </div>
                <h3
                  className="text-navy-900 font-bold text-2xl mb-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Message Sent!
                </h3>
                <p className="text-slate-600">
                  Thank you for reaching out. Our team will get back to you within
                  24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-5 sm:p-7 lg:p-9 border border-slate-100 shadow-soft space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Full Name *" htmlFor="name">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Phone Number *" htmlFor="phone">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="09XX XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Email Address" htmlFor="email">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="juan@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="City / Municipality" htmlFor="city">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Ormoc City"
                      value={formData.city}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <FormField label="System Type" htmlFor="systemType">
                  <select
                    id="systemType"
                    name="systemType"
                    value={formData.systemType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select a service...</option>
                    {systemTypes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Message" htmlFor="message">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Tell us about your property, current electricity bill, or any questions..."
                    value={formData.message}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                  />
                </FormField>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full overflow-hidden send-btn"
                  disabled={submitting}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {submitting ? (
                      <motion.span
                        key="loading"
                        className="inline-flex items-center justify-center gap-2"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.span
                          className="block w-[18px] h-[18px] rounded-full border-2 border-white/40 border-t-white"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        />
                        Sending...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        className="inline-flex items-center"
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      >
                        <span className="send-fly">
                          <span className="send-icon">
                            <Send size={18} />
                          </span>
                        </span>
                        <span className="send-text">Send Inquiry</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <p className="text-slate-400 text-xs text-center">
                  We respect your privacy. Your information will never be shared
                  with third parties.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Map Embed */}
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-solar-500/10 rounded-lg flex items-center justify-center">
              <MapPin size={16} className="text-solar-500" />
            </div>
            <span className="text-navy-900 font-semibold text-sm">
              Find Us — Lilia Avenue, Cogon, Ormoc City, Leyte 6541
            </span>
          </div>
          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-soft">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d788.1558470516892!2d124.60600752736785!3d11.016442895645005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3307f1ac0bb65341%3A0x5a61c31ee45ed6d3!2sJMC%20Solar%20Ormoc!5e1!3m2!1sen!2sph!4v1772197675888!5m2!1sen!2sph"
              className="w-full h-[40vh] sm:h-[55vh] lg:h-[70vh] border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-slate-400 text-xs mt-3 text-center">
            Map data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              OpenStreetMap
            </a>{" "}
            contributors · Lilia Avenue, Cogon, Ormoc City, Leyte 6541
          </p>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-solar-400 focus:ring-2 focus:ring-solar-400/20 focus:bg-white transition-all duration-300";

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-navy-900 font-medium text-sm">
        {label}
      </label>
      {children}
    </div>
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
      <div className="w-9 h-9 bg-solar-500/8 rounded-xl flex items-center justify-center shrink-0 text-solar-600 mt-0.5">
        {icon}
      </div>
      <span className="text-slate-600 text-sm leading-relaxed">{children}</span>
    </div>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="hover:opacity-80 transition-opacity"
        >
          {content}
        </a>
      </li>
    );
  }

  return <li>{content}</li>;
}