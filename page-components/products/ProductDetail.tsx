import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, ArrowRight, ArrowUpRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
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
      <section className="bg-navy-950 text-white pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-white/50 text-sm mb-10 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={13} />
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <ChevronRight size={13} />
            <span className="text-white/80">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div
              className="relative rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-10"
              style={{ backgroundColor: '#e5e0d8' }}
            >
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
                <Package size={96} className="text-navy-800/25" strokeWidth={1} />
              )}
            </div>

            {/* Info */}
            <div>
              {product.badge && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] bg-solar-500/15 text-solar-400 px-3 py-1.5 rounded-full mb-5">
                  {product.badge}
                </span>
              )}
              <p className="text-solar-400 text-sm font-semibold uppercase tracking-widest mb-3">
                {product.brand ? `${product.brand} · ${categoryLabel}` : categoryLabel}
              </p>
              <h1
                className="font-black text-3xl sm:text-4xl lg:text-5xl mb-5 leading-tight"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {product.name}
              </h1>
              {product.description && (
                <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
                  {product.description}
                </p>
              )}
              <Link
                href={inquiryHref}
                className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                Inquire About This Product
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Specs */}
        {(specRows.length > 0 || product.brand) && (
          <section>
            <h2
              className="font-black text-2xl sm:text-3xl text-navy-900 mb-6"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Specifications
            </h2>
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-w-2xl">
              <dl className="divide-y divide-slate-100">
                {product.brand && (
                  <div className="flex px-6 py-4">
                    <dt className="w-40 shrink-0 text-slate-500 text-sm font-medium">Brand</dt>
                    <dd className="text-navy-900 text-sm font-semibold">{product.brand}</dd>
                  </div>
                )}
                <div className="flex px-6 py-4">
                  <dt className="w-40 shrink-0 text-slate-500 text-sm font-medium">Category</dt>
                  <dd className="text-navy-900 text-sm font-semibold">{categoryLabel}</dd>
                </div>
                {specRows.map((row, i) => (
                  <div key={i} className="flex px-6 py-4">
                    <dt className="w-40 shrink-0 text-slate-500 text-sm font-medium">Spec</dt>
                    <dd className="text-navy-900 text-sm">{row}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Related service */}
        {relatedService && (
          <section>
            <Link
              href={`/services/${relatedService.slug}`}
              className="group flex items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 hover:border-solar-400 hover:bg-solar-500/5 transition-all duration-200 max-w-2xl"
            >
              <div>
                <p className="text-slate-500 text-sm mb-1">Related service</p>
                <p className="font-bold text-navy-900 group-hover:text-solar-600 transition-colors">
                  {relatedService.title}
                </p>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-solar-500 transition-colors shrink-0" />
            </Link>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2
              className="font-black text-2xl sm:text-3xl text-navy-900 mb-8"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              More {categoryLabel}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(({ product: rp, imageUrl: rpImg }) => (
                <Link key={rp.id} href={`/products/${rp.slug}`} className="group">
                  <div
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center p-6 group-hover:-translate-y-1 transition-transform duration-300"
                    style={{ backgroundColor: '#e5e0d8' }}
                  >
                    {rpImg ? (
                      <Image src={rpImg} alt={rp.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain p-6" />
                    ) : (
                      <Package size={48} className="text-navy-800/25" strokeWidth={1} />
                    )}
                  </div>
                  <p className="text-navy-900 font-bold text-sm mt-3 group-hover:text-solar-600 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {rp.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-navy-950 rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center">
          <h2
            className="text-white font-black text-2xl sm:text-3xl mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Want a quote for the {product.name}?
          </h2>
          <p className="text-white/60 text-lg mb-7 max-w-xl mx-auto">
            Tell us about your system and our team will confirm availability and pricing.
          </p>
          <Link
            href={inquiryHref}
            className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-7 py-3.5 rounded-xl transition-colors duration-200"
          >
            Get a Free Quote
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
