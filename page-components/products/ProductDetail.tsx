import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowRight, ArrowUpRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { cardVariants } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CtaBand from '@/components/ui/CtaBand';
import { cn } from '@/lib/utils';
import { NAV_SERVICES } from '@/data/services';
import type { Product } from '@/types';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  panels: 'Solar Panels',
  batteries: 'Batteries',
  inverters: 'Inverters',
  controllers: 'Charge Controllers',
  converters: 'Converters',
};

type RelatedProduct = { product: Product; imageUrl: string | null };

export default function ProductDetail({
  product,
  imageUrl,
  relatedProducts,
}: {
  product: Product;
  imageUrl: string | null;
  relatedProducts: RelatedProduct[];
}) {
  const specRows = (product.specs ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  // Resolve the related service against the LIVE service list (NAV_SERVICES), never the
  // stale data/services.ts — so the link can't point at a service that no longer exists.
  const relatedService = product.related_service
    ? NAV_SERVICES.find((s) => s.slug === product.related_service)
    : undefined;

  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category;
  const inquiryHref = `/?service=${product.related_service ?? ''}#contact`;

  return (
    <Layout>
      <PageHero
        eyebrow={product.brand ? `${product.brand} · ${categoryLabel}` : categoryLabel}
        title={product.name}
        lead={product.description || undefined}
        actions={
          <Button href={inquiryHref} size="lg">
            Inquire about this product
            <ArrowUpRight className="size-4" aria-hidden />
          </Button>
        }
      >
        {product.badge && (
          <div className="mt-5">
            <Badge tone="on-dark" caps>
              {product.badge}
            </Badge>
          </div>
        )}
      </PageHero>

      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-card bg-navy-50 flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-10"
                priority
              />
            ) : (
              <Package size={96} className="text-navy-800/25" strokeWidth={1} aria-hidden />
            )}
          </div>

          <div className="space-y-8">
            {/* Specs */}
            <div>
              <h2 className="text-h2 text-fg mb-6">Specifications</h2>
              <div className="overflow-hidden rounded-card border border-line">
                <dl className="divide-y divide-slate-100">
                  {product.brand && (
                    <div className="flex px-6 py-4">
                      <dt className="w-40 shrink-0 text-sm font-medium text-fg-subtle">Brand</dt>
                      <dd className="text-sm font-semibold text-fg">{product.brand}</dd>
                    </div>
                  )}
                  <div className="flex px-6 py-4">
                    <dt className="w-40 shrink-0 text-sm font-medium text-fg-subtle">Category</dt>
                    <dd className="text-sm font-semibold text-fg">{categoryLabel}</dd>
                  </div>
                  {specRows.map((row, i) => (
                    <div key={i} className="flex px-6 py-4">
                      <dt className="w-40 shrink-0 text-sm font-medium text-fg-subtle">Spec</dt>
                      <dd className="text-sm text-fg tabular-nums">{row}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Related service */}
            {relatedService && (
              <Link
                href={`/services/${relatedService.slug}`}
                className={cn(cardVariants({ variant: 'link-row' }), 'justify-between')}
              >
                <div>
                  <p className="text-sm text-fg-subtle">Related service</p>
                  <p className="text-title text-fg group-hover:text-solar-ink transition-colors">
                    {relatedService.title}
                  </p>
                </div>
                <ArrowRight size={20} className="shrink-0 text-fg-subtle transition-colors group-hover:text-solar-ink" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <Section tone="tint">
          <SectionHeader title={`More ${categoryLabel}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(({ product: rp, imageUrl: rpImg }) => (
              <Link
                key={rp.id}
                href={`/products/${rp.slug}`}
                className={cn(cardVariants({ variant: 'interactive' }), 'group p-3')}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy-50 flex items-center justify-center">
                  {rpImg ? (
                    <Image src={rpImg} alt={rp.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain p-6" />
                  ) : (
                    <Package size={48} className="text-navy-800/25" strokeWidth={1} aria-hidden />
                  )}
                </div>
                <p className="text-title text-fg mt-3 px-1 pb-1 transition-colors group-hover:text-solar-ink">
                  {rp.name}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Want a quote for the ${product.name}?`}
        body="Tell us about your system and our team will confirm availability and pricing."
        secondary={{ label: 'Ask about this product', href: inquiryHref }}
      />
    </Layout>
  );
}
