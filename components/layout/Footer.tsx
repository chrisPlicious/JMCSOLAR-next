'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Products', href: '/products' },
  { label: 'Contact', href: '/#contact' },
];

export default function Footer() {
  return (
    <footer className="relative bg-navy-950 text-white overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-solar-500/20 to-transparent" />

      {/* Subtle blob decoration */}
      <div className="absolute top-10 -right-20 w-60 h-60 bg-solar-500/3 blob-shape pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-12">

          {/* Brand Column */}
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex gap-2.5">
              <div className="flex gap-2.5 group">
                <div className="leading-tight">
                  <span className="font-montserrat text-base tracking-tight flex gap-1">
                    <span className="font-black text-2xl transition-colors duration-300">JMC</span>
                    <span className="text-2xl font-medium transition-colors duration-300">SOLAR</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Renewable energy advocates serving Ormoc City and Eastern Visayas. Providing free and clean energy for every Filipino home, farm, and business.
            </p>
            <a
              href="https://www.facebook.com/JMCSolarPH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            >
              <Facebook size={18} />
              <span>JMC Solar PH</span>
              <span className="text-white/30 text-xs">(3,300+ Followers)</span>
            </a>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-solar-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight size={12} className="text-solar-500/40 group-hover:text-solar-400 group-hover:translate-x-0.5 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Contact Us
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-solar-500/60 mt-0.5 shrink-0" />
                <a href="tel:+639175088220" className="text-white/40 hover:text-white transition-colors text-sm">
                  0917 508 8220
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-solar-500/60 mt-0.5 shrink-0" />
                <a href="mailto:jmcsolarph@gmail.com" className="text-white/40 hover:text-white transition-colors text-sm break-all">
                  jmcsolarph@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-solar-500/60 mt-0.5 shrink-0" />
                <span className="text-white/40 text-sm">
                  Lilia Avenue, Cogon,<br />
                  Ormoc City, Leyte 6541<br />
                  Philippines
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-14 pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-white/30 text-sm text-center sm:text-left">
            © {new Date().getFullYear()} JMC Solar PH. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Renewable Energy Advocates · Ormoc City, Leyte, Philippines
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
