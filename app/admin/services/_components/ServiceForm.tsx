'use client';

import { type ComponentType, type ReactNode, useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { DbService, DbServiceDetail } from '@/lib/supabase/types';
import type { ServiceFormState } from '../actions';

type IconName = keyof typeof Icons;

function DynIcon({ name, ...props }: { name: string } & LucideProps) {
  const IC = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  return IC ? <IC {...props} /> : null;
}

function SectionLabel({ children, variant = 'solar' }: { children: ReactNode; variant?: 'solar' | 'slate' }) {
  return (
    <span className={`font-semibold text-sm uppercase tracking-widest mb-3 block ${variant === 'solar' ? 'text-solar-600' : 'text-slate-500'}`}>
      {children}
    </span>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-navy-900 font-black text-2xl leading-tight mt-2 mb-4">
      {children}
    </h2>
  );
}

const ICON_OPTIONS = [
  'Sun',
  'Zap',
  'Battery',
  'Droplets',
  'Car',
  'ShieldCheck',
  'SlidersHorizontal',
  'Wrench',
] as const;

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors';
const inputClsHero =
  'w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-solar-500/30 transition-colors';
const inputClsTransparent =
  'w-full bg-transparent border-0 px-4 py-2.5 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/20 rounded-none transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';
const addBtnCls = 'text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors';
const removeBtnCls = 'text-red-400 hover:text-red-600 transition-colors text-sm px-2';

type ServiceFormProps = {
  action: (prevState: ServiceFormState, fd: FormData) => Promise<ServiceFormState>;
  service?: DbService;
  detail?: DbServiceDetail | null;
};

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ServiceForm({ action, service, detail }: ServiceFormProps) {
  const isEdit = Boolean(service);
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if ('success' in state) {
      toast.success(isEdit ? 'Service updated successfully' : 'Service created successfully');
      router.push('/admin/services');
    } else if ('error' in state) {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  // Basic fields
  const [icon, setIcon] = useState(service?.icon ?? 'Sun');
  const [title, setTitle] = useState(service?.title ?? '');
  const [slug, setSlug] = useState(service?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(isEdit);

  // Detail section open/closed
  const [detailOpen, setDetailOpen] = useState(detail != null);

  // Dynamic rows
  const [howItWorks, setHowItWorks] = useState<{ step: string; description: string }[]>(
    detail?.how_it_works ?? []
  );
  const [benefits, setBenefits] = useState<
    { iconName: string; title: string; description: string }[]
  >(detail?.benefits ?? []);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(detail?.specs ?? []);
  const [useCases, setUseCases] = useState<{ item: string }[]>(detail?.use_cases ?? []);
  const [sources, setSources] = useState<{ title: string; url: string; publisher: string }[]>(
    detail?.sources ?? []
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!slugEdited) {
      setSlug(toSlug(val));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugEdited(true);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/services"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path
              d="M12 15l-5-5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="font-display font-black text-navy-950 text-2xl">
          {isEdit ? 'Edit Service' : 'New Service'}
        </h1>
      </div>

      <div className={`bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 mb-24 transition-all duration-300 ${detailOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {state && 'error' in state && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form id="main-form" action={dispatch} className="space-y-5">
          {/* Section: Basic Info */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Basic Info
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          {/* Icon */}
          <div>
            <label className={labelCls}>
              Icon <span className="text-red-400">*</span>
            </label>
            <select
              name="icon"
              required
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={inputCls}
            >
              {ICON_OPTIONS.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              value={title}
              onChange={handleTitleChange}
              className={inputCls}
            />
          </div>

          {/* Slug */}
          <div>
            <label className={labelCls}>
              Slug <span className="text-red-400">*</span>
            </label>
            <input
              name="slug_display"
              required
              value={slug}
              onChange={handleSlugChange}
              className={inputCls}
              placeholder="auto-derived from title"
            />
            <input type="hidden" name="slug" value={slug} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={service?.description ?? ''}
              className={inputCls}
            />
          </div>

          {/* Display Order */}
          <div>
            <label className={labelCls}>Display Order</label>
            <input
              name="display_order"
              type="number"
              defaultValue={service?.display_order ?? 0}
              className={inputCls}
            />
          </div>

          {/* Highlight */}
          <div className="flex items-center gap-3">
            <input
              id="highlight"
              name="highlight"
              type="checkbox"
              defaultChecked={service?.highlight ?? false}
              className="w-4 h-4 accent-solar-500"
            />
            <label htmlFor="highlight" className="text-sm font-medium text-slate-700">
              Highlight (featured service)
            </label>
          </div>

          {/* ── Detail Page Section ── */}
          <hr className="border-slate-100 my-6" />

          <button
            type="button"
            onClick={() => setDetailOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <span>{detailOpen ? '▼' : '▶'}</span>
            <span>Detail Page</span>
          </button>

          {detailOpen && (
            <div className="space-y-12 pt-4">

              {/* ── Hero Preview ── */}
              <div className="bg-navy-900 rounded-2xl p-8 space-y-5">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                  <span>Home</span>
                  <span>/</span>
                  <span>Services</span>
                  <span>/</span>
                  <span className="text-white/70">{title || 'Service Title'}</span>
                </div>

                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <DynIcon name={icon} size={28} className="text-white" />
                </div>

                <h2 className="text-white font-black text-3xl leading-tight">
                  {title || 'Service Title'}
                </h2>

                <div>
                  <label className="block text-white/40 text-xs mb-1.5">Tagline</label>
                  <input
                    name="tagline"
                    defaultValue={detail?.tagline ?? ''}
                    placeholder="Short tagline shown below the title..."
                    className={inputClsHero}
                  />
                </div>

                <span className="inline-flex items-center gap-2 bg-solar-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm opacity-60 cursor-default">
                  Get a Free Quote <ArrowRight size={16} />
                </span>
                <p className="text-white/30 text-xs italic">(auto-generated CTA button)</p>
              </div>

              {/* ── Overview Section ── */}
              <section className="space-y-4">
                <SectionLabel>Overview</SectionLabel>
                <SectionHeading>What Is {title || '...'}?</SectionHeading>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Overview paragraph</label>
                  <textarea
                    name="overview"
                    rows={5}
                    defaultValue={detail?.overview ?? ''}
                    placeholder="General overview of the service..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Detailed explanation</label>
                  <textarea
                    name="what_is_it"
                    rows={6}
                    defaultValue={detail?.what_is_it ?? ''}
                    placeholder="More detailed description of what this service is..."
                    className={inputCls}
                  />
                </div>
              </section>

              {/* ── How It Works ── */}
              <section className="space-y-4">
                <SectionLabel>Process</SectionLabel>
                <SectionHeading>How It Works</SectionHeading>

                <div className="space-y-4 mt-4">
                  {howItWorks.map((row, i) => (
                    <div key={i} className="flex gap-5 items-start">
                      <div className="shrink-0 w-10 h-10 bg-solar-500 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          name={`hw_step_${i}`}
                          value={row.step}
                          onChange={(e) => {
                            const next = [...howItWorks];
                            next[i] = { ...next[i], step: e.target.value };
                            setHowItWorks(next);
                          }}
                          placeholder="Step title"
                          className={`${inputCls} font-bold`}
                        />
                        <input
                          name={`hw_desc_${i}`}
                          value={row.description}
                          onChange={(e) => {
                            const next = [...howItWorks];
                            next[i] = { ...next[i], description: e.target.value };
                            setHowItWorks(next);
                          }}
                          placeholder="Step description"
                          className={inputCls}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setHowItWorks(howItWorks.filter((_, j) => j !== i))}
                        className={`${removeBtnCls} mt-3`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHowItWorks([...howItWorks, { step: '', description: '' }])}
                  className={addBtnCls}
                >
                  + Add Step
                </button>
              </section>

              {/* ── Benefits ── */}
              <section className="space-y-4">
                <SectionLabel>Why It Matters</SectionLabel>
                <SectionHeading>Key Benefits</SectionHeading>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {benefits.map((row, i) => (
                    <div key={i} className="relative bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                        className={`${removeBtnCls} absolute top-3 right-3`}
                      >
                        ✕
                      </button>

                      <div className="w-11 h-11 bg-solar-500/10 rounded-xl flex items-center justify-center mb-3">
                        <DynIcon name={row.iconName || 'Star'} size={22} className="text-solar-600" />
                      </div>

                      <input
                        name={`ben_icon_${i}`}
                        value={row.iconName}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], iconName: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Icon name (e.g. Zap)"
                        className="w-full text-xs text-slate-400 bg-transparent border-0 outline-none px-0 py-1 focus:text-slate-600 transition-colors"
                      />
                      <input
                        name={`ben_title_${i}`}
                        value={row.title}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], title: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Benefit title"
                        className="w-full font-bold text-navy-900 text-base bg-transparent border-0 outline-none px-0 py-1 focus:ring-0 placeholder-slate-300"
                      />
                      <input
                        name={`ben_desc_${i}`}
                        value={row.description}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], description: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Short description"
                        className="w-full text-sm text-slate-600 bg-transparent border-0 outline-none px-0 py-1 focus:ring-0 placeholder-slate-300"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBenefits([...benefits, { iconName: '', title: '', description: '' }])}
                  className={addBtnCls}
                >
                  + Add Benefit
                </button>
              </section>

              {/* ── Use Cases ── */}
              <section className="space-y-4">
                <SectionLabel>Applications</SectionLabel>
                <SectionHeading>Common Use Cases</SectionHeading>

                <div className="space-y-3 mt-4">
                  {useCases.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-eco shrink-0" />
                      <input
                        name={`uc_item_${i}`}
                        value={row.item}
                        onChange={(e) => {
                          const next = [...useCases];
                          next[i] = { item: e.target.value };
                          setUseCases(next);
                        }}
                        placeholder="Use case description"
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setUseCases(useCases.filter((_, j) => j !== i))}
                        className={removeBtnCls}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUseCases([...useCases, { item: '' }])}
                  className={addBtnCls}
                >
                  + Add Use Case
                </button>
              </section>

              {/* ── Specs ── */}
              <section className="space-y-4">
                <SectionLabel>Technical Details</SectionLabel>
                <SectionHeading>Typical Specifications</SectionHeading>

                <div className="rounded-2xl border border-slate-200 mt-4">
                  {specs.map((row, i) => (
                    <div key={i} className={`grid grid-cols-[1fr_2fr_auto] items-center ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <input
                        name={`spec_label_${i}`}
                        value={row.label}
                        onChange={(e) => {
                          const next = [...specs];
                          next[i] = { ...next[i], label: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Label"
                        className={`${inputClsTransparent} border-r border-slate-100 font-semibold text-navy-900`}
                      />
                      <input
                        name={`spec_value_${i}`}
                        value={row.value}
                        onChange={(e) => {
                          const next = [...specs];
                          next[i] = { ...next[i], value: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Value"
                        className={`${inputClsTransparent} text-slate-600`}
                      />
                      <button
                        type="button"
                        onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                        className={`${removeBtnCls} pr-3`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                  className={addBtnCls}
                >
                  + Add Spec
                </button>
              </section>

              {/* ── CTA Preview (non-editable) ── */}
              <div className="bg-navy-900 rounded-3xl px-5 py-8 text-center">
                <h2 className="text-white font-black text-2xl mb-2">
                  Ready to install {title || '...'}?
                </h2>
                <p className="text-white/50 text-sm">
                  JMC Solar PH serves Ormoc City and all of Eastern Visayas. Get a free site assessment and quote.
                </p>
                <p className="text-white/30 text-xs mt-3 italic">(This section is auto-generated on the public page)</p>
              </div>

              {/* ── Sources ── */}
              <section className="border-t border-slate-100 pt-8 space-y-4">
                <SectionLabel variant="slate">References &amp; Sources</SectionLabel>

                <div className="space-y-4">
                  {sources.map((row, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ExternalLink size={14} className="mt-3 shrink-0 text-slate-400" />
                      <div className="flex-1 space-y-2">
                        <input
                          name={`src_pub_${i}`}
                          value={row.publisher}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], publisher: e.target.value };
                            setSources(next);
                          }}
                          placeholder="Publisher (e.g. DOE Philippines)"
                          className={`${inputCls} text-sm`}
                        />
                        <input
                          name={`src_title_${i}`}
                          value={row.title}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], title: e.target.value };
                            setSources(next);
                          }}
                          placeholder="Source title"
                          className={`${inputCls} text-sm`}
                        />
                        <input
                          name={`src_url_${i}`}
                          value={row.url}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], url: e.target.value };
                            setSources(next);
                          }}
                          placeholder="https://..."
                          className={`${inputCls} text-sm`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSources(sources.filter((_, j) => j !== i))}
                        className={`${removeBtnCls} mt-3`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSources([...sources, { title: '', url: '', publisher: '' }])}
                  className={addBtnCls}
                >
                  + Add Source
                </button>
              </section>

            </div>
          )}
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/services"
          className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          form="main-form"
          disabled={isPending}
          className="bg-solar-500 hover:bg-solar-400 disabled:opacity-60 text-navy-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {isPending
            ? 'Saving…'
            : isEdit
              ? 'Update Service'
              : 'Create Service'}
        </button>
      </div>
    </>
  );
}
