import { type ComponentType } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import type { DbService } from '@/lib/supabase/types';

type IconName = keyof typeof Icons;

function Icon({ name, ...props }: { name: string } & LucideProps) {
  const IC = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  return IC ? <IC {...props} /> : null;
}

interface ServiceEmptyStateProps {
  service: DbService;
}

export default function ServiceEmptyState({ service }: ServiceEmptyStateProps) {
  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="relative pt-28 pb-20 px-4 bg-navy-900">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <span>/</span>
            <span className="text-white">{service.title}</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Icon name={service.icon} size={28} className="text-white" />
            </div>
          </div>

          <h1
            className="text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {service.title}
          </h1>
        </div>
      </div>

      {/* ── Coming Soon Message ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-solar-500/10 rounded-2xl mb-6">
          <Icon name="Clock" size={32} className="text-solar-500" />
        </div>

        <h2
          className="text-navy-900 font-black text-2xl sm:text-3xl mb-4"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Coming Soon
        </h2>

        <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto mb-10">
          This service page is coming soon. We&apos;re still preparing the details.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft size={18} />
            Back to Services
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
          >
            Contact Us to Inquire
          </Link>
        </div>
      </div>
    </Layout>
  );
}
