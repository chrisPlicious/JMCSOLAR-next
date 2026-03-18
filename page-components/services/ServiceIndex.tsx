'use client';

import { useState, useRef, useEffect, type ComponentType } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import WhoWeServeCard from "@/components/ui/WhoWeServeCard";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { DbService } from "@/lib/supabase/types";
import { clientTypes } from "@/data/services";
import Layout from "@/components/layout/Layout";

const solarImg = '/assets/solar.jpg';

type IconName = keyof typeof Icons;

export default function ServicesPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    client
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (data) setServices(data);
      });
  }, []);

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
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
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  }

  function onMouseLeave() {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  }

  function toggleCard(index: number) {
    setActiveIndex((prev) => (prev === index ? null : index));
  }

  return (
    <Layout>
    <section id="services" className="py-20 transition-all duration-700 ">
      <div className="max-w-10/13 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-4 block">
            What We Do
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Complete Solar <span className="text-solar-500">Solutions</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            From the initial consultation to after-sales support — we handle every
            step of your solar journey for residential, commercial, agricultural,
            and industrial clients.
          </p>
        </div>
        {/* Mobile: 2-col card grid (hidden on desktop) */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mb-12">
          {services.map((service) => {
            const IconComponent = Icons[service.icon as IconName] as
              | ComponentType<LucideProps>
              | undefined;
            return (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="flex flex-col items-center text-center gap-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-solar-300 transition-all duration-200"
              >
                {service.highlight && (
                  <span className="text-[10px] font-bold text-solar-600 uppercase tracking-widest bg-solar-500/10 px-2 py-0.5 rounded-full">
                    ★ Featured
                  </span>
                )}
                <div className="w-14 h-14 bg-solar-500/10 rounded-2xl flex items-center justify-center">
                  {IconComponent && <IconComponent size={28} className="text-solar-600" />}
                </div>
                <span className="text-navy-900 font-semibold text-sm leading-snug">
                  {service.title}
                </span>
                <span className="text-solar-600 text-xs font-medium flex items-center gap-1 mt-auto">
                  Learn more <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Desktop: Accordion Cards (hidden on mobile) */}
        <div
          ref={scrollRef}
          className="hidden lg:flex gap-3 justify-center overflow-x-auto scrollbar-hide lg:h-150 mb-12 px-1"
          style={{ cursor: "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {services.map((service, index) => {
            const isActive = activeIndex === index;
            const IconComponent = Icons[service.icon as IconName] as
              | ComponentType<LucideProps>
              | undefined;
            return (
              <div
                key={service.id}
                onClick={() => toggleCard(index)}
                style={{ width: isActive ? "900px" : "92px" }}
                className="relative rounded-2xl overflow-hidden cursor-pointer shrink-0 transition-all duration-500 ease-in-out"
              >
                {/* Background image */}
                <img
                  src={solarImg}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Overlay */}
                <div
                  className={`absolute inset-0 transition-all duration-500 ${isActive ? "bg-navy-900/70" : "bg-navy-900/80"}`}
                />
                {/* Solar accent glow when active */}
                {isActive && (
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-solar-500/20 rounded-full blur-3xl pointer-events-none" />
                )}
                {/* Collapsed: vertical label */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${isActive ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  {IconComponent && (
                    <IconComponent size={30} className="text-solar-400" />
                  )}
                  <span
                    className="text-white font-semibold text-lg whitespace-nowrap"
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                    }}
                  >
                    {service.title}
                  </span>
                </div>
                {/* Expanded: content */}
                <div
                  className={`absolute inset-0 p-8 flex flex-col justify-end transition-opacity duration-400 ${isActive ? "opacity-100 delay-150" : "opacity-0 pointer-events-none"}`}
                >
                  {service.highlight && (
                    <span className="text-solar-400 text-md font-bold uppercase tracking-widest mb-3">
                      ★ Featured
                    </span>
                  )}
                  {IconComponent && (
                    <div className="w-12 h-12 bg-solar-500/20 border border-solar-500/30 rounded-xl flex items-center justify-center mb-4">
                      <IconComponent size={22} className="text-solar-400" />
                    </div>
                  )}
                  <h3
                    className="text-white text-4xl font-bold mb-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-white/75 text-lg leading-relaxed mb-5">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between font-semibold text-md text-solar-400 hover:text-solar-300 transition-colors ">
                    <a href={`/?service=${service.id}#contact`}>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 "
                      >
                        Inquire now <ArrowRight size={22} />
                      </button>
                    </a>
                    <Link
                      href={`/services/${service.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* CTA */}
        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            href={
              activeIndex !== null && services[activeIndex]
                ? `/?service=${services[activeIndex].id}#contact`
                : '/#contact'
            }
          >
            Inquire About a Service
            <ArrowRight size={18} />
          </Button>
        </div>
        {/* Who We Serve */}
        <div className="mt-24">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-4 block">
              Who We Serve
            </span>
            <h2
              className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Solar for <span className="text-solar-500">Every Client</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Whether you're a homeowner, business, farmer, or industrial operator
              — we have the right solar solution for you.
            </p>
          </div>
          {/* Alternating rows */}
          <div className="flex flex-col gap-16">
            {clientTypes.map((client, index) => (
              <WhoWeServeCard
                key={client.id}
                client={client}
                reversed={index % 2 !== 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
    </Layout>
  );
}
