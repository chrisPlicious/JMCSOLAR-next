'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { NAV_SERVICES } from '@/data/services';
import type { FooterProvince } from '@/data/locations';
import { Container } from '@/components/ui/Section';
import { fadeUp, fadeIn, revealOnScroll } from '@/lib/motion';
import { FACEBOOK_URL } from '@/lib/seo/site';
import { BUSINESS, HQ_AREA, SERVICE_AREA } from '@/lib/seo/business';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Products', href: '/products' },
  { label: 'Results', href: '/results' },
  { label: 'Locations', href: '/locations' },
  { label: 'Calculator', href: '/calculator' },
  { label: 'Get a quote', href: '/booking' },
  { label: 'Contact', href: '/#contact' },
];

const headingClass = 'caps mb-5 font-sans';
const linkClass =
  'group flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg';
const arrowClass =
  'text-fg-subtle transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-solar-ink';

export default function Footer({ locations }: { locations: FooterProvince[] }) {
  return (
    <footer className="surface-dark relative bg-navy-950">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <motion.div className="flex flex-col gap-5" variants={fadeUp} {...revealOnScroll}>
            <Link href="/" className="flex gap-1 font-wordmark text-2xl leading-tight text-fg">
              <span className="font-extrabold">JMC</span>
              <span className="font-medium text-fg-muted">SOLAR</span>
            </Link>
            <p className="text-sm text-fg-muted">
              Renewable energy advocates serving {SERVICE_AREA}. Providing free and clean energy for every Filipino home, farm, and business.
            </p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-solar-ink hover:underline"
            >
              <Facebook size={18} aria-hidden />
              <span>JMC Solar PH</span>
              <span className="text-xs font-normal text-fg-subtle">(3,300+ Followers)</span>
            </a>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeUp} {...revealOnScroll}>
            <p id="footer-quick-links" className={headingClass}>Quick Links</p>
            <ul aria-labelledby="footer-quick-links" className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    <ArrowRight size={12} className={arrowClass} aria-hidden />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p id="footer-services" className={`${headingClass} mt-8`}>Services</p>
            <ul aria-labelledby="footer-services" className="flex flex-col gap-3">
              {NAV_SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`} className={linkClass}>
                    <ArrowRight size={12} className={arrowClass} aria-hidden />
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Service Areas */}
          <motion.div variants={fadeUp} {...revealOnScroll}>
            <p id="footer-areas" className={headingClass}>Service Areas</p>
            <div role="group" aria-labelledby="footer-areas" className="flex flex-col gap-5">
              {locations.map((province) => (
                <div key={province.slug}>
                  <Link
                    href={`/locations/${province.slug}`}
                    className="caps mb-2 block transition-colors hover:text-fg"
                  >
                    {province.name}
                  </Link>
                  <ul className="flex flex-col gap-2">
                    {province.cities.map((city) => (
                      <li key={city.slug}>
                        <Link href={`/locations/${city.slug}`} className={linkClass}>
                          <ArrowRight size={12} className={arrowClass} aria-hidden />
                          {city.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link
              href="/locations"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-solar-ink hover:underline"
            >
              View all locations
              <ArrowRight size={12} aria-hidden />
            </Link>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={fadeUp} {...revealOnScroll}>
            <p id="footer-contact" className={headingClass}>Contact Us</p>
            <ul aria-labelledby="footer-contact" className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <Phone size={15} className="mt-0.5 shrink-0 text-solar-ink" aria-hidden />
                <a href={`tel:${BUSINESS.phone.e164}`} className="text-sm text-fg-muted transition-colors hover:text-fg">
                  {BUSINESS.phone.display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="mt-0.5 shrink-0 text-solar-ink" aria-hidden />
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="text-sm break-all text-fg-muted transition-colors hover:text-fg"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="mt-0.5 shrink-0 text-solar-ink" aria-hidden />
                <span className="text-sm text-fg-muted">
                  {BUSINESS.address.street},<br />
                  {HQ_AREA} {BUSINESS.address.postalCode}<br />
                  {BUSINESS.address.countryName}
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row"
          variants={fadeIn}
          {...revealOnScroll}
        >
          <p className="text-center text-sm text-fg-subtle sm:text-left">
            © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
          </p>
          <p className="text-xs text-fg-subtle">Renewable Energy Advocates · Ormoc City, Leyte, Philippines</p>
        </motion.div>
      </Container>
    </footer>
  );
}
