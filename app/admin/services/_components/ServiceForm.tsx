'use client';

import { type ComponentType, type ReactNode, useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { CheckCircle, ChevronDown, ChevronRight, ExternalLink, Plus, Upload, X } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { DbService, DbServiceDetail } from '@/lib/firebase/types';
import type { ServiceFormState } from '../actions';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar,
} from '../../_components/AdminForm';

type IconName = keyof typeof Icons;

function DynIcon({ name, ...props }: { name: string } & LucideProps) {
  const IC = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  return IC ? <IC {...props} /> : null;
}

/** Group header for a detail-page section: small label + the heading the public page will show. */
function DetailSectionHeader({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="mb-4">
      <span className="caps block">{label}</span>
      {children && <h2 className="text-h3 text-fg mt-1">{children}</h2>}
    </div>
  );
}

function AddRowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Plus size={14} aria-hidden />
      {children}
    </Button>
  );
}

function RemoveRowButton({ onClick, label, className }: { onClick: () => void; label: string; className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      className={`shrink-0 text-red-700 hover:bg-red-50 ${className ?? ''}`}
    >
      <X size={16} aria-hidden />
    </Button>
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

  // Accordion photo
  const [photoUrl, setPhotoUrl] = useState(service?.photo_url ?? '');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('path', `services/${slug || crypto.randomUUID()}/accordion`);
      setUploadProgress(50);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      setPhotoUrl(url);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadProgress(null);
    }
  }

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
      <AdminFormHeader title={isEdit ? 'Edit Service' : 'New Service'} backHref="/admin/services" />

      <AdminFormCard className={`mb-24 transition-[max-width] duration-300 ${detailOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <FormErrorBanner>{state && 'error' in state ? state.error : null}</FormErrorBanner>

        <form id="main-form" action={dispatch} className="space-y-5">
          <FormSection title="Basic Info" />

          {/* Icon */}
          <Field id="service-icon" label="Icon" required>
            <Select name="icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {ICON_OPTIONS.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </Select>
          </Field>

          {/* Title */}
          <Field id="service-title" label="Title" required>
            <Input name="title" value={title} onChange={handleTitleChange} />
          </Field>

          {/* Slug */}
          <div>
            <Field id="service-slug" label="Slug" required>
              <Input
                name="slug_display"
                value={slug}
                onChange={handleSlugChange}
                placeholder="auto-derived from title"
              />
            </Field>
            <input type="hidden" name="slug" value={slug} />
          </div>

          {/* Description */}
          <Field id="service-description" label="Description" required>
            <Textarea name="description" rows={4} defaultValue={service?.description ?? ''} />
          </Field>

          {/* Display Order */}
          <Field id="service-display-order" label="Display Order">
            <Input name="display_order" type="number" defaultValue={service?.display_order ?? 0} />
          </Field>

          {/* Highlight */}
          <div className="flex items-center gap-3">
            <input
              id="highlight"
              name="highlight"
              type="checkbox"
              defaultChecked={service?.highlight ?? false}
              className="w-4 h-4 accent-solar-500"
            />
            <label htmlFor="highlight" className="text-sm font-medium text-fg">
              Highlight (featured service)
            </label>
          </div>

          {/* Accordion Photo */}
          <div>
            <Label>Accordion Background Photo</Label>
            <input type="hidden" name="photo_url" value={photoUrl} />
            {photoUrl ? (
              <div className="relative w-full aspect-[5/2] rounded-control overflow-hidden border border-line">
                <img src={photoUrl} alt="Accordion preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                <button
                  type="button"
                  onClick={() => { setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-soft transition-colors"
                >
                  <X size={14} className="text-slate-600" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="w-full h-32 border-2 border-dashed border-slate-300 rounded-control flex flex-col items-center justify-center gap-2 text-fg-subtle hover:border-solar-400 hover:text-solar-ink transition-colors disabled:opacity-60"
              >
                <Upload size={22} aria-hidden />
                <span className="text-sm font-medium">
                  {uploadProgress !== null ? `Uploading… ${uploadProgress}%` : 'Click to upload photo'}
                </span>
                <span className="text-xs">JPG, PNG, WEBP — shown as accordion card background</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* ── Detail Page Section ── */}
          <hr className="border-line my-6" />

          <button
            type="button"
            onClick={() => setDetailOpen((o) => !o)}
            aria-expanded={detailOpen}
            className="flex items-center gap-2 rounded-control text-sm font-semibold text-fg hover:text-navy-700 transition-colors"
          >
            {detailOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
            <span>Detail Page</span>
          </button>

          {detailOpen && (
            <div className="space-y-12 pt-4">

              {/* ── Hero ── */}
              <section className="bg-navy-50 rounded-card p-6 space-y-5">
                <div className="flex items-center gap-2 text-fg-muted text-xs">
                  <span>Home</span>
                  <span>/</span>
                  <span>Services</span>
                  <span>/</span>
                  <span className="text-fg">{title || 'Service Title'}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-control border border-line flex items-center justify-center">
                    <DynIcon name={icon} size={28} className="text-navy-700" aria-hidden />
                  </div>
                  <h2 className="text-h3 text-fg">{title || 'Service Title'}</h2>
                </div>

                <Field id="service-tagline" label="Tagline">
                  <Input
                    name="tagline"
                    defaultValue={detail?.tagline ?? ''}
                    placeholder="Short tagline shown below the title..."
                  />
                </Field>

                <p className="text-fg-muted text-xs italic">The quote button in the hero is auto-generated.</p>
              </section>

              {/* ── Overview Section ── */}
              <section className="space-y-4">
                <DetailSectionHeader label="Overview">What Is {title || '...'}?</DetailSectionHeader>

                <Field id="service-overview" label="Overview paragraph">
                  <Textarea
                    name="overview"
                    rows={5}
                    defaultValue={detail?.overview ?? ''}
                    placeholder="General overview of the service..."
                  />
                </Field>
                <Field id="service-what-is-it" label="Detailed explanation">
                  <Textarea
                    name="what_is_it"
                    rows={6}
                    defaultValue={detail?.what_is_it ?? ''}
                    placeholder="More detailed description of what this service is..."
                  />
                </Field>
              </section>

              {/* ── How It Works ── */}
              <section className="space-y-4">
                <DetailSectionHeader label="Process">How It Works</DetailSectionHeader>

                <div className="space-y-4 mt-4">
                  {howItWorks.map((row, i) => (
                    <div key={i} className="flex gap-5 items-start">
                      <div className="shrink-0 w-10 h-10 bg-solar-500 rounded-full flex items-center justify-center text-navy-950 font-bold text-sm mt-1">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          name={`hw_step_${i}`}
                          value={row.step}
                          onChange={(e) => {
                            const next = [...howItWorks];
                            next[i] = { ...next[i], step: e.target.value };
                            setHowItWorks(next);
                          }}
                          placeholder="Step title"
                          aria-label={`Step ${i + 1} title`}
                          className="font-bold"
                        />
                        <Input
                          name={`hw_desc_${i}`}
                          value={row.description}
                          onChange={(e) => {
                            const next = [...howItWorks];
                            next[i] = { ...next[i], description: e.target.value };
                            setHowItWorks(next);
                          }}
                          placeholder="Step description"
                          aria-label={`Step ${i + 1} description`}
                        />
                      </div>
                      <RemoveRowButton
                        label={`Remove step ${i + 1}`}
                        onClick={() => setHowItWorks(howItWorks.filter((_, j) => j !== i))}
                        className="mt-1.5"
                      />
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={() => setHowItWorks([...howItWorks, { step: '', description: '' }])}>
                  Add Step
                </AddRowButton>
              </section>

              {/* ── Benefits ── */}
              <section className="space-y-4">
                <DetailSectionHeader label="Why It Matters">Key Benefits</DetailSectionHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {benefits.map((row, i) => (
                    <div key={i} className="relative bg-slate-50 rounded-card p-5 border border-line space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 bg-solar-100 rounded-control flex items-center justify-center">
                          <DynIcon name={row.iconName || 'Star'} size={22} className="text-solar-700" aria-hidden />
                        </div>
                        <RemoveRowButton
                          label={`Remove benefit ${i + 1}`}
                          onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                        />
                      </div>

                      <Input
                        name={`ben_icon_${i}`}
                        value={row.iconName}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], iconName: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Icon name (e.g. Zap)"
                        aria-label={`Benefit ${i + 1} icon name`}
                      />
                      <Input
                        name={`ben_title_${i}`}
                        value={row.title}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], title: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Benefit title"
                        aria-label={`Benefit ${i + 1} title`}
                        className="font-bold"
                      />
                      <Input
                        name={`ben_desc_${i}`}
                        value={row.description}
                        onChange={(e) => {
                          const next = [...benefits];
                          next[i] = { ...next[i], description: e.target.value };
                          setBenefits(next);
                        }}
                        placeholder="Short description"
                        aria-label={`Benefit ${i + 1} description`}
                      />
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={() => setBenefits([...benefits, { iconName: '', title: '', description: '' }])}>
                  Add Benefit
                </AddRowButton>
              </section>

              {/* ── Use Cases ── */}
              <section className="space-y-4">
                <DetailSectionHeader label="Applications">Common Use Cases</DetailSectionHeader>

                <div className="space-y-3 mt-4">
                  {useCases.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-eco shrink-0" aria-hidden />
                      <Input
                        name={`uc_item_${i}`}
                        value={row.item}
                        onChange={(e) => {
                          const next = [...useCases];
                          next[i] = { item: e.target.value };
                          setUseCases(next);
                        }}
                        placeholder="Use case description"
                        aria-label={`Use case ${i + 1}`}
                        className="flex-1"
                      />
                      <RemoveRowButton
                        label={`Remove use case ${i + 1}`}
                        onClick={() => setUseCases(useCases.filter((_, j) => j !== i))}
                      />
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={() => setUseCases([...useCases, { item: '' }])}>
                  Add Use Case
                </AddRowButton>
              </section>

              {/* ── Specs ── */}
              <section className="space-y-4">
                <DetailSectionHeader label="Technical Details">Typical Specifications</DetailSectionHeader>

                <div className="space-y-2 mt-4">
                  {specs.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                      <Input
                        name={`spec_label_${i}`}
                        value={row.label}
                        onChange={(e) => {
                          const next = [...specs];
                          next[i] = { ...next[i], label: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Label"
                        aria-label={`Spec ${i + 1} label`}
                        className="font-semibold"
                      />
                      <Input
                        name={`spec_value_${i}`}
                        value={row.value}
                        onChange={(e) => {
                          const next = [...specs];
                          next[i] = { ...next[i], value: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Value"
                        aria-label={`Spec ${i + 1} value`}
                      />
                      <RemoveRowButton
                        label={`Remove spec ${i + 1}`}
                        onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                      />
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={() => setSpecs([...specs, { label: '', value: '' }])}>
                  Add Spec
                </AddRowButton>
              </section>

              {/* ── CTA Preview (non-editable) ── */}
              <div className="bg-navy-50 rounded-card px-5 py-8 text-center">
                <h2 className="text-h3 text-fg mb-2">
                  Ready to install {title || '...'}?
                </h2>
                <p className="text-fg-muted text-sm">
                  JMC Solar PH serves Ormoc City and all of Eastern Visayas. Get a free site assessment and quote.
                </p>
                <p className="text-fg-muted text-xs mt-3 italic">(This section is auto-generated on the public page)</p>
              </div>

              {/* ── Sources ── */}
              <section className="border-t border-line pt-8 space-y-4">
                <DetailSectionHeader label="References & Sources" />

                <div className="space-y-4">
                  {sources.map((row, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ExternalLink size={14} className="mt-4 shrink-0 text-slate-500" aria-hidden />
                      <div className="flex-1 space-y-2">
                        <Input
                          name={`src_pub_${i}`}
                          value={row.publisher}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], publisher: e.target.value };
                            setSources(next);
                          }}
                          placeholder="Publisher (e.g. DOE Philippines)"
                          aria-label={`Source ${i + 1} publisher`}
                        />
                        <Input
                          name={`src_title_${i}`}
                          value={row.title}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], title: e.target.value };
                            setSources(next);
                          }}
                          placeholder="Source title"
                          aria-label={`Source ${i + 1} title`}
                        />
                        <Input
                          name={`src_url_${i}`}
                          value={row.url}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], url: e.target.value };
                            setSources(next);
                          }}
                          placeholder="https://..."
                          aria-label={`Source ${i + 1} URL`}
                        />
                      </div>
                      <RemoveRowButton
                        label={`Remove source ${i + 1}`}
                        onClick={() => setSources(sources.filter((_, j) => j !== i))}
                        className="mt-1.5"
                      />
                    </div>
                  ))}
                </div>
                <AddRowButton onClick={() => setSources([...sources, { title: '', url: '', publisher: '' }])}>
                  Add Source
                </AddRowButton>
              </section>

            </div>
          )}
        </form>
      </AdminFormCard>

      <StickySaveBar
        cancelHref="/admin/services"
        pending={isPending}
        label={isEdit ? 'Update Service' : 'Create Service'}
      />
    </>
  );
}
