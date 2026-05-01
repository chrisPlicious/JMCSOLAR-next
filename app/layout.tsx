import type { Metadata } from 'next';
import { Poppins, Montserrat, Geist } from 'next/font/google';
import './globals.css';
import LoaderScreen from '@/components/ui/LoaderScreen';
import LoaderGate from '@/components/ui/LoaderGate';
import ScrollToTop from '@/components/ui/ScrollToTop';
import PageTransition from '@/components/ui/PageTransition';
import HeroBgLayer from './_components/HeroBgLayer';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jmcsolar.ph';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/Logos/JMC SOLAR.png',
    apple: '/Logos/JMC SOLAR.png',
  },
  title: {
    default: 'JMC Solar PH | Solar Installation in Ormoc City, Leyte',
    template: '%s | JMC Solar PH',
  },
  description:
    'JMC Solar PH provides professional solar installation services in Ormoc City, Leyte. Hybrid solar, on-grid, battery storage, EV chargers, and more. Future is Electric.',
  keywords:
    'solar panels Philippines, solar installation Ormoc City, hybrid solar system Leyte, JMC Solar PH, solar energy Visayas, solar panel Leyte, solar energy Philippines',
  openGraph: {
    title: 'JMC Solar PH — Future is Electric',
    description:
      'Professional solar installation services in Ormoc City, Leyte. From residential rooftops to 100kW+ industrial systems.',
    url: '/',
    siteName: 'JMC Solar PH',
    type: 'website',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary',
    title: 'JMC Solar PH — Future is Electric',
    description:
      'Professional solar installation in Ormoc City, Leyte. Hybrid solar, on-grid, battery storage, EV chargers.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="preload" as="image" href="/assets/bg-1.jpg" />
      </head>
      <body className={`${geist.variable} ${poppins.variable} ${montserrat.variable}`}>
        <ScrollToTop />
        <HeroBgLayer />
        <LoaderScreen />
        <LoaderGate>
          <PageTransition>{children}</PageTransition>
        </LoaderGate>
      </body>
    </html>
  );
}
