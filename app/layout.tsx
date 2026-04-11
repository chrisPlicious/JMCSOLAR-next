import type { Metadata } from 'next';
import { Poppins, Montserrat, Geist } from 'next/font/google';
import './globals.css';
import LoaderScreen from '@/components/ui/LoaderScreen';
import ScrollToTop from '@/components/ui/ScrollToTop';
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

export const metadata: Metadata = {
  icons: {
    icon: '/Logos/JMC SOLAR.png',
    apple: '/Logos/JMC SOLAR.png',
  },
  title: 'JMC Solar PH | Solar Installation in Ormoc City, Leyte',
  description:
    'JMC Solar PH provides professional solar installation services in Ormoc City, Leyte. Hybrid solar, on-grid, battery storage, EV chargers, and more. Future is Electric.',
  keywords:
    'solar panels Philippines, solar installation Ormoc City, hybrid solar system Leyte, JMC Solar PH, solar energy Visayas',
  openGraph: {
    title: 'JMC Solar PH — Future is Electric',
    description:
      'Professional solar installation services in Ormoc City, Leyte. From residential rooftops to 100kW+ industrial systems.',
    type: 'website',
    locale: 'en_PH',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} ${poppins.variable} ${montserrat.variable}`}>
        <ScrollToTop />
        <LoaderScreen />
        {children}
      </body>
    </html>
  );
}
