'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import type { DbService, DbServiceDetail } from '@/lib/supabase/types';
import type { ServiceFormState } from '../actions';

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
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

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
  const [state, dispatch, isPending] = useActionState(action, null);

  // Basic fields
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-3xl mb-24">
        {state?.error && (
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
              defaultValue={service?.icon ?? 'Sun'}
              className={inputCls}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
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
            <div className="space-y-6 pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Detail Page Content
              </p>

              {/* Tagline */}
              <div>
                <label className={labelCls}>Tagline</label>
                <input
                  name="tagline"
                  defaultValue={detail?.tagline ?? ''}
                  className={inputCls}
                />
              </div>

              {/* Overview */}
              <div>
                <label className={labelCls}>Overview</label>
                <textarea
                  name="overview"
                  rows={5}
                  defaultValue={detail?.overview ?? ''}
                  className={inputCls}
                />
              </div>

              {/* What Is It */}
              <div>
                <label className={labelCls}>What Is It</label>
                <textarea
                  name="what_is_it"
                  rows={6}
                  defaultValue={detail?.what_is_it ?? ''}
                  className={inputCls}
                />
              </div>

              {/* ── How It Works ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  How It Works
                </p>
                {howItWorks.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        name={`hw_step_${i}`}
                        value={row.step}
                        onChange={(e) => {
                          const next = [...howItWorks];
                          next[i] = { ...next[i], step: e.target.value };
                          setHowItWorks(next);
                        }}
                        placeholder="Step Title"
                        className={inputCls}
                      />
                      <input
                        name={`hw_desc_${i}`}
                        value={row.description}
                        onChange={(e) => {
                          const next = [...howItWorks];
                          next[i] = { ...next[i], description: e.target.value };
                          setHowItWorks(next);
                        }}
                        placeholder="Description"
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setHowItWorks(howItWorks.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm px-2 mt-3"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setHowItWorks([...howItWorks, { step: '', description: '' }])
                  }
                  className="text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Step
                </button>
              </div>

              {/* ── Benefits ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Benefits
                </p>
                {benefits.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        name={`ben_icon_${i}`}
                        value={row.iconName}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], iconName: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Icon Name"
                        className={inputCls}
                      />
                      <input
                        name={`ben_title_${i}`}
                        value={row.title}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], title: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Title"
                        className={inputCls}
                      />
                      <input
                        name={`ben_desc_${i}`}
                        value={row.description}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], description: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Description"
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm px-2 mt-3"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setBenefits([...benefits, { iconName: '', title: '', description: '' }])
                  }
                  className="text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Benefit
                </button>
              </div>

              {/* ── Specs ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Specs
                </p>
                {specs.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-3 items-center">
                    <input
                      name={`spec_label_${i}`}
                      value={row.label}
                      onChange={(e) => {
                        const next = [...specs];
                        next[i] = { ...next[i], label: e.target.value };
                        setSpecs(next);
                      }}
                      placeholder="Label"
                      className={inputCls}
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
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                  className="text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Spec
                </button>
              </div>

              {/* ── Use Cases ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Use Cases
                </p>
                {useCases.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-3 items-center">
                    <input
                      name={`uc_item_${i}`}
                      value={row.item}
                      onChange={(e) => {
                        const next = [...useCases];
                        next[i] = { item: e.target.value };
                        setUseCases(next);
                      }}
                      placeholder="Use case item"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setUseCases(useCases.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCases([...useCases, { item: '' }])}
                  className="text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Use Case
                </button>
              </div>

              {/* ── Sources ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Sources
                </p>
                {sources.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        name={`src_title_${i}`}
                        value={row.title}
                        onChange={(e) => {
                          const next = [...sources];
                          next[i] = { ...next[i], title: e.target.value };
                          setSources(next);
                        }}
                        placeholder="Title"
                        className={inputCls}
                      />
                      <input
                        name={`src_url_${i}`}
                        value={row.url}
                        onChange={(e) => {
                          const next = [...sources];
                          next[i] = { ...next[i], url: e.target.value };
                          setSources(next);
                        }}
                        placeholder="URL"
                        className={inputCls}
                      />
                      <input
                        name={`src_pub_${i}`}
                        value={row.publisher}
                        onChange={(e) => {
                          const next = [...sources];
                          next[i] = { ...next[i], publisher: e.target.value };
                          setSources(next);
                        }}
                        placeholder="Publisher"
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSources(sources.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm px-2 mt-3"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setSources([...sources, { title: '', url: '', publisher: '' }])
                  }
                  className="text-solar-600 border border-solar-300 hover:bg-solar-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Source
                </button>
              </div>
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
