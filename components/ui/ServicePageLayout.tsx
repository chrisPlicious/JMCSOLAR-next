'use client';

import { type ComponentType } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import Layout from '../layout/Layout';
import Button from './Button';
import Card from './Card';
import PageHero from './PageHero';
import CtaBand from './CtaBand';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { fadeUp, revealOnScroll } from '@/lib/motion';

type IconName = keyof typeof Icons;

function Icon({ name, ...props }: { name: string } & LucideProps) {
  const IC = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  return IC ? <IC {...props} /> : null;
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
  serviceId,
  overview,
  whatIsIt,
  howItWorks,
  benefits,
  useCases,
  specs,
  sources,
}: ServicePageProps) {
  const contactHref = serviceId ? `/?service=${serviceId}#contact` : '/#contact';

  return (
    <Layout>
      <PageHero
        title={title}
        lead={tagline}
        media={heroBgImage ? { src: heroBgImage } : undefined}
        actions={
          <>
            <Button href="/booking" size="lg">
              Get a quote <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button href={contactHref} variant="outline-dark" size="lg">
              Message us
            </Button>
          </>
        }
      />

      <Section tone="white" container="narrow" containerClassName="space-y-16 sm:space-y-20">
        {/* ── Overview ── */}
        {(overview || whatIsIt) && (
          <motion.section variants={fadeUp} {...revealOnScroll}>
            <SectionHeader title={`What is ${title}?`} className="mb-6 sm:mb-6" />
            {overview && <p className="text-lead text-fg-muted mb-6">{overview}</p>}
            {whatIsIt && <p className="text-lead text-fg-muted">{whatIsIt}</p>}
          </motion.section>
        )}

        {/* ── How It Works ── */}
        {howItWorks?.length > 0 && (
          <motion.section variants={fadeUp} {...revealOnScroll}>
            <SectionHeader title="How it works" className="mb-8 sm:mb-8" />
            <ol className="space-y-6">
              {howItWorks.map((item, i) => (
                <li key={i} className="flex gap-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-solar-500 font-display text-sm font-bold text-navy-950 tabular-nums">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-title text-fg mb-1">{item.step}</h3>
                    <p className="text-fg-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.section>
        )}

        {/* ── Benefits ── */}
        {benefits?.length > 0 && (
          <motion.section variants={fadeUp} {...revealOnScroll}>
            <SectionHeader title="Key benefits" className="mb-8 sm:mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <Card key={i} variant="tint" padding="md">
                  <div className="mb-4 grid size-11 place-items-center rounded-control bg-solar-100">
                    <Icon name={b.iconName} className="size-5 text-solar-ink" aria-hidden />
                  </div>
                  <h3 className="text-title text-fg mb-2">{b.title}</h3>
                  <p className="text-sm text-fg-muted">{b.description}</p>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Use Cases ── */}
        {useCases?.length > 0 && (
          <motion.section variants={fadeUp} {...revealOnScroll}>
            <SectionHeader title="Common use cases" className="mb-6 sm:mb-6" />
            <ul className="space-y-3">
              {useCases.map((uc, i) => (
                <li key={i} className="flex items-start gap-3 text-fg">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-eco" aria-hidden />
                  <span>{uc}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Specs ── */}
        {specs?.length > 0 && (
          <motion.section variants={fadeUp} {...revealOnScroll}>
            <SectionHeader title="Typical specifications" className="mb-6 sm:mb-6" />
            <div className="overflow-hidden rounded-card border border-line">
              <table className="w-full text-sm sm:text-base">
                <tbody>
                  {specs.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <th
                        scope="row"
                        className="w-2/5 border-r border-line px-3 py-3 text-left font-semibold text-fg sm:px-6"
                      >
                        {spec.label}
                      </th>
                      <td className="px-3 py-3 text-fg-muted sm:px-6">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* ── Sources ── */}
        {sources?.length > 0 && (
          <section className="border-t border-line pt-10">
            <h2 className="caps mb-5">References &amp; Sources</h2>
            <ul className="space-y-2">
              {sources.map((src, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-fg-subtle">
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                  <span>
                    <span className="font-medium text-fg">{src.publisher}</span>
                    {' — '}
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-solar-ink underline underline-offset-2 hover:no-underline"
                    >
                      {src.title}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Section>

      <CtaBand
        title={`Ready to install ${title}?`}
        body="JMC Solar PH serves Ormoc City and all of Eastern Visayas. Get a free site assessment and quote."
        secondary={{ label: 'Message us', href: contactHref }}
      />
    </Layout>
  );
}
