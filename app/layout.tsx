import type { Metadata } from 'next';
import { Poppins, Montserrat, Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';
import LoaderScreen from '@/components/ui/LoaderScreen';
import LoaderGate from '@/components/ui/LoaderGate';
import ScrollToTop from '@/components/ui/ScrollToTop';
import PageTransition from '@/components/ui/PageTransition';
import MotionProvider from '@/components/ui/MotionProvider';
import HeroBgLayer from './_components/HeroBgLayer';
import { cn } from "@/lib/utils";
import { SITE_URL } from '@/lib/seo/site';
import { SITE_OPEN_GRAPH } from '@/lib/seo/metadata';
import { siteGraphLd } from '@/lib/seo/organization';
import { Analytics } from '@vercel/analytics/next';

// Font roles (see app/globals.css): Geist = body, Poppins = headings
// (700/800/900 ladder), Montserrat = the JMC SOLAR wordmark only.
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Geist Mono = figures in the power-flow simulators. Not preloaded: only the
// service pages that use it download it.
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/JMC.png',
    apple: '/JMC.png',
  },
  title: {
    default: 'JMC Solar PH | Solar Installation in Ormoc City & Cebu',
    template: '%s | JMC Solar PH',
  },
  description:
    'JMC Solar PH provides professional solar installation services in Ormoc City, Leyte and Cebu, Central Visayas. Hybrid solar, on-grid, battery storage, EV chargers, and more. Future is Electric.',
  // Site default only — no `url` here, or every page without its own openGraph
  // would advertise the homepage as its og:url. Pages set theirs via pageMetadata().
  openGraph: SITE_OPEN_GRAPH,
  // Card type only. Next fills twitter:title/description/image from each page's
  // Open Graph; setting them here would stamp the homepage copy on every page.
  twitter: { card: 'summary_large_image' },
  // NOTE: no root-level `alternates.canonical` — in the App Router it is inherited
  // by every child route that lacks its own canonical, pointing them all at the
  // homepage (GSC "Alternate page with proper canonical tag"). The homepage sets
  // its own canonical in app/page.tsx; every other page already self-canonicalizes.
  // No `robots` or `keywords` either: index,follow is the default, and Google
  // ignores the keywords tag.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html
      lang="en"
      className={cn(geist.variable, poppins.variable, montserrat.variable, geistMono.variable, 'font-sans')}
      nonce={nonce}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/assets/bg-1.jpg" />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraphLd()) }}
        />
        <NextTopLoader
          color="var(--color-solar-500)"
          height={3}
          showSpinner={false}
          crawl={true}
          crawlSpeed={200}
          speed={200}
          shadow="0 0 10px var(--color-solar-500),0 0 5px var(--color-solar-500)"
        />
        <ScrollToTop />
        <HeroBgLayer />
        <LoaderScreen />
        <MotionProvider>
          <LoaderGate>
            <PageTransition>{children}</PageTransition>
          </LoaderGate>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
