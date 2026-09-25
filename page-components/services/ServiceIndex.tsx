'use client';

import { useState, useRef, type ComponentType } from "react";
import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import WhoWeServeCard from "@/components/ui/WhoWeServeCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cardVariants } from "@/components/ui/Card";
import PageHero from "@/components/ui/PageHero";
import CtaBand from "@/components/ui/CtaBand";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArrowRight, X } from "lucide-react";
import { clientTypes, type Service } from "@/data/services";
import Layout from "@/components/layout/Layout";
import { fadeUp, revealOnScroll } from "@/lib/motion";
import { cn } from "@/lib/utils";

const solarImg = '/assets/solar.jpg';

type IconName = keyof typeof Icons;

// Services are fetched server-side (app/services/page.tsx) and passed in as a prop,
// so the /services/[slug] links are present in the initial SSR HTML for crawlers.
export default function ServicesPage({ services }: { services: Service[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  }

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }

  function onMouseUp() {
    isDown.current = false;
  }

  function toggleCard(index: number) {
    setActiveIndex((prev) => (prev === index ? null : index));
  }

  return (
    <Layout>
      <PageHero
        title="Complete Solar Services"
        lead="From the initial consultation to after-sales support — we handle every step of your solar journey for residential, commercial, agricultural, and industrial clients."
      />

      <Section id="services" tone="white">
        {/* Mobile: 2-col card grid (hidden on desktop) */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-4">
          {services.map((service) => {
            const IconComponent = Icons[service.icon as IconName] as
              | ComponentType<LucideProps>
              | undefined;
            return (
              <motion.div key={service.slug} variants={fadeUp} {...revealOnScroll}>
                <Link
                  href={`/services/${service.slug}`}
                  className={cn(
                    cardVariants({ variant: 'interactive', padding: 'sm' }),
                    'flex h-full flex-col items-center gap-3 text-center',
                  )}
                >
                  {service.highlight && <Badge tone="solar">Featured</Badge>}
                  <div className="grid size-14 place-items-center rounded-control bg-solar-100">
                    {IconComponent && <IconComponent className="size-7 text-solar-ink" aria-hidden />}
                  </div>
                  <span className="text-title text-fg">{service.title}</span>
                  <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-solar-ink">
                    Learn more <ArrowRight className="size-3" aria-hidden />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop: accordion. Starts at the left edge and scrolls if the row
            outgrows the container, so every card stays reachable. Proximity
            snapping only — mandatory snapping fights the drag-to-scroll. */}
        <div
          ref={scrollRef}
          className="hidden lg:flex h-150 gap-3 justify-start overflow-x-auto scrollbar-hide snap-x snap-proximity scroll-px-1 px-1 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {services.map((service, index) => {
            const isActive = activeIndex === index;
            const IconComponent = Icons[service.icon as IconName] as
              | ComponentType<LucideProps>
              | undefined;
            return (
              <div
                key={service.slug}
                className={cn(
                  // Both states size themselves with flex-basis (a length, never `auto`) so the
                  // open/close tween is one continuous interpolation. Using `w-24` collapsed and
                  // `flex-1` expanded made the card snap to its new width in a single frame and
                  // only the flex-grow ramp animated. `shrink-0` + basis-[28rem] also supplies the
                  // 28rem floor that `min-width` used to, and unlike min-width it animates.
                  'surface-dark relative snap-start overflow-hidden rounded-card shrink-0 transition-[flex-basis,flex-grow] duration-500 ease-out-quart',
                  isActive ? 'grow basis-[28rem]' : 'grow-0 basis-24',
                )}
              >
                {/* Background image */}
                <img
                  src={service.photo_url ?? solarImg}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Overlay */}
                <div
                  className={cn(
                    'absolute inset-0 transition-colors duration-500',
                    isActive ? 'bg-navy-950/55' : 'bg-navy-950/80',
                  )}
                  aria-hidden
                />
                {/* Collapsed: vertical label — the card's toggle */}
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => toggleCard(index)}
                    aria-expanded={false}
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card"
                  >
                    {IconComponent && <IconComponent className="size-7 text-solar-ink" aria-hidden />}
                    <span className="font-display text-lg font-semibold whitespace-nowrap text-fg [writing-mode:vertical-rl]">
                      {service.title}
                    </span>
                  </button>
                )}
                {/* Expanded: content */}
                {isActive && (
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleCard(index)}
                      aria-expanded
                      aria-label={`Collapse ${service.title}`}
                      className="absolute top-4 right-4 text-fg-muted hover:bg-white/10 hover:text-fg"
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                    {service.highlight && (
                      <Badge tone="on-dark" className="mb-3 self-start">
                        Featured
                      </Badge>
                    )}
                    {IconComponent && (
                      <div className="mb-4 grid size-12 place-items-center rounded-control border border-solar-500/30 bg-solar-500/20">
                        <IconComponent className="size-6 text-solar-ink" aria-hidden />
                      </div>
                    )}
                    <h3 className="text-h2 text-fg mb-2">{service.title}</h3>
                    <p className="text-lead text-fg-muted mb-6 max-w-2xl">{service.description}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <Button href={`/?service=${service.slug}#contact`}>
                        Inquire now <ArrowRight className="size-4" aria-hidden />
                      </Button>
                      <Button href={`/services/${service.slug}`} variant="link" size="inline">
                        Learn more
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Who We Serve */}
      <Section tone="tint">
        <SectionHeader
          title="Solar for every client"
          lead="Whether you're a homeowner, business, farmer, or industrial operator — we have the right solar solution for you."
        />
        <div className="flex flex-col gap-16">
          {clientTypes.map((client, index) => (
            <WhoWeServeCard
              key={client.id}
              client={client}
              reversed={index % 2 !== 0}
            />
          ))}
        </div>
      </Section>

      <CtaBand
        title="Not sure which service you need?"
        body="Tell us about your site and energy use and we'll recommend the right system."
      />
    </Layout>
  );
}
