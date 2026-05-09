'use client';

import { type ComponentType, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import Layout from '../layout/Layout';
import Button from './Button';

type IconName = keyof typeof Icons;

function Icon({ name, ...props }: { name: string } & LucideProps) {
  const IC = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  return IC ? <IC {...props} /> : null;
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
      {children}
    </span>
  );
}

export interface ServicePageProps {
  title: string;
  tagline: string;
  heroBgImage?: string;
  iconName: string;
  serviceId?: string;
  overview: string;
  whatIsIt: string;
  howItWorks: { step: string; description: string }[];
  benefits: { iconName: string; title: string; description: string }[];
  useCases: string[];
  specs: { label: string; value: string }[];
  sources: { title: string; url: string; publisher: string }[];
}

export default function ServicePageLayout({
  title,
  tagline,
  heroBgImage,
  iconName,
  serviceId,
  overview,
  whatIsIt,
  howItWorks,
  benefits,
  useCases,
  specs,
  sources,
}: ServicePageProps) {
  return (
    <Layout>
      {/* ── Hero ── */}
      <div
        className={`relative pt-24 pb-14 px-4 sm:pt-28 sm:pb-20 sm:px-6 ${heroBgImage ? 'bg-cover bg-center' : 'bg-navy-900'}`}
        style={heroBgImage ? { backgroundImage: `url(${heroBgImage})` } : undefined}
      >
        {heroBgImage && <div className="absolute inset-0" />}
        <motion.div
          className="relative z-10 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <span>/</span>
            <span className="text-white">{title}</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Icon name={iconName} size={28} className="text-white" />
            </div>
          </div>

          <h1
            className="text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </h1>
          <p className="text-white/80 text-base sm:text-xl leading-relaxed max-w-3xl mb-8">{tagline}</p>
          <Button
            href={serviceId ? `/?service=${serviceId}#contact` : '/#contact'}
            className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200 text-base"
          >
            Get a Free Quote <Icon name="ArrowRight" size={18} />
          </Button>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 space-y-12 sm:space-y-16 lg:space-y-20">

        {/* ── Overview ── */}
        {(overview || whatIsIt) && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Label>Overview</Label>
            <h2 className="text-navy-900 font-black text-2xl sm:text-3xl leading-tight mt-2 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              What Is {title}?
            </h2>
            {overview && <p className="text-slate-600 text-lg leading-relaxed mb-6">{overview}</p>}
            {whatIsIt && <p className="text-slate-600 text-lg leading-relaxed">{whatIsIt}</p>}
          </motion.section>
        )}

        {/* ── How It Works ── */}
        {howItWorks?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Label>Process</Label>
            <h2 className="text-navy-900 font-black text-2xl sm:text-3xl leading-tight mt-2 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              How It Works
            </h2>
            <div className="space-y-6 mt-8">
              {howItWorks.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex gap-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <div className="shrink-0 w-10 h-10 bg-solar-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-navy-900 font-bold text-base mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {item.step}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Benefits ── */}
        {benefits?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Label>Why It Matters</Label>
            <h2 className="text-navy-900 font-black text-2xl sm:text-3xl leading-tight mt-2 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Key Benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <div className="w-11 h-11 bg-solar-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon name={b.iconName} size={22} className="text-solar-600" />
                  </div>
                  <h3 className="text-navy-900 font-bold text-base mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {b.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{b.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Use Cases ── */}
        {useCases?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Label>Applications</Label>
            <h2 className="text-navy-900 font-black text-2xl sm:text-3xl leading-tight mt-2 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Common Use Cases
            </h2>
            <ul className="mt-6 space-y-3">
              {useCases.map((uc, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-slate-700"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <CheckCircle size={18} className="text-green-eco mt-0.5 shrink-0" />
                  <span>{uc}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Specs ── */}
        {specs?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Label>Technical Details</Label>
            <h2 className="text-navy-900 font-black text-2xl sm:text-3xl leading-tight mt-2 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Typical Specifications
            </h2>
            <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {specs.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 sm:px-6 py-3 font-semibold text-navy-900 w-2/5 border-r border-slate-100 text-sm sm:text-base">
                        {spec.label}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-slate-600 text-sm sm:text-base">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* ── CTA Strip ── */}
        <motion.section
          className="bg-navy-900 rounded-3xl px-5 py-8 sm:px-8 sm:py-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-white font-black text-2xl sm:text-3xl mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Ready to install {title}?
          </h2>
          <p className="text-white/70 text-lg mb-7">
            JMC Solar PH serves Ormoc City and all of Eastern Visayas. Get a free site assessment and quote.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={serviceId ? `/?service=${serviceId}#contact` : '/#contact'}
              className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
            >
              Contact JMC Solar PH <Icon name="ArrowRight" size={18} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition-colors duration-200"
            >
              <ArrowLeft size={16} /> View all services
            </Link>
          </div>
        </motion.section>

        {/* ── Sources ── */}
        {sources?.length > 0 && (
          <motion.section
            className="border-t border-slate-100 pt-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-widest mb-5">
              References & Sources
            </h3>
            <ul className="space-y-2">
              {sources.map((src, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                  <ExternalLink size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    <span className="font-medium text-slate-700">{src.publisher}</span>
                    {' — '}
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-solar-600 hover:text-solar-500 underline underline-offset-2"
                    >
                      {src.title}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

      </div>
    </Layout>
  );
}