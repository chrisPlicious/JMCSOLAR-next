# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static data files with Supabase PostgreSQL, add photo upload for projects and products, and build a password-protected admin panel at `/admin`.

**Architecture:** A Next.js Server Component fetches data from Supabase server-side and passes it as props to existing Client Components. Admin routes are protected by a Next.js middleware that checks an HMAC-signed cookie. All file uploads go through Server Actions using the service role key — never exposed to the browser.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, TypeScript, Tailwind CSS 4

---

## File Map

### Created
| File | Purpose |
|---|---|
| `supabase/migrations/001_initial_schema.sql` | DB schema for all three tables |
| `lib/supabase/server.ts` | Supabase client factories (anon + admin) |
| `lib/supabase/types.ts` | TypeScript DB row types |
| `lib/auth.ts` | Session token generation / verification |
| `middleware.ts` | Admin route guard |
| `app/admin/login/page.tsx` | Login page |
| `app/admin/login/actions.ts` | Login server action |
| `app/admin/layout.tsx` | Admin shell layout |
| `app/admin/page.tsx` | Admin dashboard |
| `app/admin/projects/page.tsx` | Projects list |
| `app/admin/projects/new/page.tsx` | New project form |
| `app/admin/projects/[id]/page.tsx` | Edit project + photo gallery |
| `app/admin/projects/actions.ts` | Project CRUD server actions |
| `app/admin/products/page.tsx` | Products list |
| `app/admin/products/new/page.tsx` | New product form |
| `app/admin/products/[id]/page.tsx` | Edit product form |
| `app/admin/products/actions.ts` | Product CRUD server actions |

### Modified
| File | Change |
|---|---|
| `next.config.ts` | Add `remotePatterns` for Supabase Storage |
| `types/index.ts` | Snake_case fields, add `'school'` to `ProjectCategory`, add `Product` type |
| `app/projects/page.tsx` | Fetch from Supabase, pass data as props |
| `app/products/page.tsx` | Fetch from Supabase, pass data as props |
| `page-components/projects/ProjectIndex.tsx` | Accept `projects` prop instead of static import |
| `page-components/products/ProductsIndex.tsx` | Accept `products` prop, inline categories, update field names |
| `components/ui/ProjectCard.tsx` | Use `facebook_url`, `cover_image_path`, `system_size` |

### Deleted
| File | Reason |
|---|---|
| `data/projects.ts` | Replaced by Supabase DB |
| `data/products.ts` | Replaced by Supabase DB |

---

## Task 1: Install Supabase and create `.env.local`

**Files:**
- Modify: `package.json`
- Create: `.env.local`

- [ ] **Step 1: Install the Supabase JS client**

```bash
npm install @supabase/supabase-js
```

Expected: `@supabase/supabase-js` appears in `package.json` dependencies.

- [ ] **Step 2: Create `.env.local` in the project root**

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ADMIN_PASSWORD=<choose-a-strong-password>
SESSION_SECRET=<random-64-char-string>
```

Retrieve values from: Supabase Dashboard → Project Settings → API.
Generate `SESSION_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **Step 3: Verify `.env.local` is gitignored**

Check `.gitignore` — `.env.local` should already be listed (Next.js adds it by default). If not, add it.

- [ ] **Step 4: Commit the dependency change**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js dependency"
```

---

## Task 2: Create the database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  system_size text,
  description text,
  location text,
  facebook_url text,
  cover_image_path text,
  created_at timestamptz default now()
);

create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  storage_path text not null,
  caption text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text not null,
  specs text,
  description text,
  badge text,
  image_path text,
  related_service text,
  created_at timestamptz default now()
);
```

- [ ] **Step 2: Run the SQL in the Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste the SQL above → Run.

Verify: Go to Table Editor — three tables (`projects`, `project_images`, `products`) should appear.

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "chore: add initial Supabase schema migration"
```

---

## Task 3: Create Supabase Storage buckets

_(Done in the Supabase Dashboard — no code changes)_

- [ ] **Step 1: Create `project-images` bucket**

Supabase Dashboard → Storage → New bucket → Name: `project-images` → Public: ON → Create.

- [ ] **Step 2: Create `product-images` bucket**

Supabase Dashboard → Storage → New bucket → Name: `product-images` → Public: ON → Create.

- [ ] **Step 3: Verify public access**

Click each bucket → Settings → confirm "Public bucket" is enabled. Public URLs will be in the format:
`https://<project-ref>.supabase.co/storage/v1/object/public/project-images/<path>`

---

## Task 4: Supabase client utilities

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: Create `lib/supabase/types.ts`**

```typescript
export type DbProject = {
  id: string;
  title: string;
  category: string;
  system_size: string | null;
  description: string | null;
  location: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  created_at: string;
};

export type DbProjectImage = {
  id: string;
  project_id: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type DbProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  specs: string | null;
  description: string | null;
  badge: string | null;
  image_path: string | null;
  related_service: string | null;
  created_at: string;
};
```

- [ ] **Step 2: Create `lib/supabase/server.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

/** Read-only client — safe for Server Components fetching public data */
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Admin client — service role key, for Server Actions only */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Convert a storage path to a full public URL */
export function getPublicUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase client utilities"
```

---

## Task 5: Update TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Replace the `Project` and `Product` interfaces in `types/index.ts`**

Replace the entire file content with:

```typescript
export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

// Snake_case fields match the Supabase DB schema
export interface Project {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'school';
  system_size: string | null;
  description: string | null;
  location: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: 'panels' | 'batteries' | 'inverters' | 'controllers' | 'converters';
  specs: string | null;
  description: string | null;
  badge: string | null;
  image_path: string | null;
  related_service: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  quote: string;
  source: 'Google' | 'Facebook';
  date?: string;
}

export interface Partner {
  name: string;
  logo?: string;
  url: string;
}

export type NavItem = {
  label: string;
  href: string;
};

// 'school' added — was missing from previous type
export type ProjectCategory =
  | 'all'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'
  | 'school';

export type ProductCategory =
  | 'panels'
  | 'batteries'
  | 'inverters'
  | 'controllers'
  | 'converters';

export interface ClientType {
  id: string;
  icon: string;
  title: string;
  description: string;
  image: string;
  badge: 'residential' | 'commercial' | 'agricultural' | 'industrial';
}
```

- [ ] **Step 2: Run the TypeScript compiler to find all breakages**

```bash
npx tsc --noEmit
```

Expected: errors in `ProjectCard.tsx`, `ProjectIndex.tsx`, `ProductsIndex.tsx`, and the data files. These are fixed in Tasks 6–8.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: update types to match Supabase schema"
```

---

## Task 6: Update `next.config.ts` and `ProjectCard.tsx`

**Files:**
- Modify: `next.config.ts`
- Modify: `components/ui/ProjectCard.tsx`

- [ ] **Step 1: Update `next.config.ts` to allow Supabase Storage images**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['framer-motion'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Update `components/ui/ProjectCard.tsx` — rename fields**

Replace the file content with:

```typescript
'use client';

import { MapPin, Zap, ExternalLink } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
}

const categoryGradients: Record<Project['category'], string> = {
  residential:  'from-blue-700 via-blue-500 to-blue-400',
  commercial:   'from-purple-700 via-purple-500 to-purple-400',
  industrial:   'from-orange-700 via-orange-500 to-orange-400',
  agricultural: 'from-green-700 via-green-500 to-green-400',
  school:       'from-solar-700 via-solar-500 to-solar-400',
};

const categoryIcons: Record<Project['category'], string> = {
  residential:  '🏠',
  commercial:   '🏢',
  industrial:   '🏭',
  agricultural: '🌾',
  school:       '🏫',
};

const categoryLabels: Record<Project['category'], string> = {
  residential:  'Residential',
  commercial:   'Commercial',
  industrial:   'Industrial',
  agricultural: 'Agricultural',
  school:       'School',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="relative flex-shrink-0 w-[88vw] h-[300px] sm:w-[560px] sm:h-[400px] md:w-[800px] md:h-[560px] lg:w-[1000px] lg:h-[680px] rounded-2xl overflow-hidden transition-transform hover:scale-101 duration-300 ease-in-out select-none">

      {/* Background: image if available, gradient fallback */}
      {project.cover_image_path ? (
        <img
          src={project.cover_image_path}
          alt={project.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[project.category]}`} />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors duration-500" />

      {/* Category label — top left */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm md:text-xl font-semibold px-3 py-1 rounded-full">
          {categoryLabels[project.category]}
        </span>
      </div>

      {/* Facebook link — top right */}
      {project.facebook_url && (
        <a
          href={project.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/40 transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={18} />
        </a>
      )}

      {/* Centered emoji — only when no image */}
      {!project.cover_image_path && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl opacity-20">{categoryIcons[project.category]}</span>
        </div>
      )}

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-5 pt-10 z-10">
        <h3
          className="text-white font-bold text-base md:text-xl leading-snug mb-2"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {project.title}
        </h3>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          {project.system_size && (
            <span className="flex items-center gap-1">
              <Zap size={15} className="text-solar-400" />
              {project.system_size}
            </span>
          )}
          {project.location && (
            <span className="flex items-center gap-1">
              <MapPin size={15} />
              {project.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts components/ui/ProjectCard.tsx
git commit -m "feat: update ProjectCard for Supabase fields and add image remote pattern"
```

---

## Task 7: Update public projects page

**Files:**
- Modify: `app/projects/page.tsx`
- Modify: `page-components/projects/ProjectIndex.tsx`

- [ ] **Step 1: Update `ProjectIndex.tsx` to accept props**

Replace `page-components/projects/ProjectIndex.tsx`:

```typescript
'use client';

import { useRef } from 'react';
import type { MouseEvent } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import Layout from '@/components/layout/Layout';
import type { Project } from '@/types';

interface Props {
  projects: Project[];
}

export default function ProjectsPage({ projects }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  }

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }

  function onMouseUp() {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  function onMouseLeave() {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  return (
    <Layout>
      <section id="projects" className="bg-white mx-auto py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-4 block">
            Our Work
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Projects &{' '}
            <span className="text-solar-500">Installations</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            From residential rooftops to large-scale industrial farms — browse our completed solar
            installations across Eastern Visayas.
          </p>
          <p className="text-slate-400 text-sm mt-3">Drag or swipe to explore →</p>
        </div>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-5 overflow-x-auto py-2 pb-4 px-1"
          style={{ cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
```

- [ ] **Step 2: Update `app/projects/page.tsx` to be a Server Component**

```typescript
import ProjectsPage from '@/page-components/projects/ProjectIndex';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import type { Project } from '@/types';

export default async function Projects() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const projects: Project[] = (data ?? []).map((p) => ({
    ...p,
    cover_image_path: getPublicUrl('project-images', p.cover_image_path),
  }));

  return <ProjectsPage projects={projects} />;
}
```

- [ ] **Step 3: Run `npx tsc --noEmit` — only product errors should remain**

- [ ] **Step 4: Run `npm run dev` and open `http://localhost:3000/projects`**

Expected: page loads (shows gradient fallback cards if DB is empty, or real data if seeded).

- [ ] **Step 5: Commit**

```bash
git add app/projects/page.tsx page-components/projects/ProjectIndex.tsx
git commit -m "feat: connect public projects page to Supabase"
```

---

## Task 8: Update public products page

**Files:**
- Modify: `app/products/page.tsx`
- Modify: `page-components/products/ProductsIndex.tsx`

- [ ] **Step 1: Update `ProductsIndex.tsx` to accept props**

Replace `page-components/products/ProductsIndex.tsx`. Key changes:
- Add `products: Product[]` prop
- Move `productCategories` inline (remove import from `data/products`)
- Change `product.image` → `product.image_path`
- Change `product.relatedService` → `product.related_service`
- Remove `priceLabel` (not rendered anyway)
- Import `Product` and `ProductCategory` from `@/types`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sun,
  Battery,
  Zap,
  SlidersHorizontal,
  Shuffle,
  ArrowRight,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import type { Product, ProductCategory } from '@/types';

const productCategories: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'All Products'      },
  { id: 'panels',      label: 'Solar Panels'       },
  { id: 'batteries',   label: 'Batteries'          },
  { id: 'inverters',   label: 'Inverters'          },
  { id: 'controllers', label: 'Charge Controllers' },
  { id: 'converters',  label: 'Converters'         },
];

const categoryIcon: Record<ProductCategory, (size: number) => React.ReactNode> = {
  panels:      (s) => <Sun size={s} strokeWidth={1.2} />,
  batteries:   (s) => <Battery size={s} strokeWidth={1.2} />,
  inverters:   (s) => <Zap size={s} strokeWidth={1.2} />,
  controllers: (s) => <SlidersHorizontal size={s} strokeWidth={1.2} />,
  converters:  (s) => <Shuffle size={s} strokeWidth={1.2} />,
};

function ProductCard({ product, index }: { product: Product; index: number }) {
  const number = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="text-[13px] text-slate-400 font-medium mb-2.5 block tracking-wider">
        {number}
      </span>

      <div
        className="relative rounded-[1.4rem] overflow-hidden group-hover:-translate-y-1 transition-all duration-300"
        style={{ backgroundColor: '#e5e0d8' }}
      >
        <div className="aspect-[3/4] flex items-center justify-center p-8">
          {product.image_path ? (
            <img
              src={product.image_path}
              alt={product.name}
              className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="text-navy-800/25 group-hover:text-navy-800/40 group-hover:scale-110 transition-all duration-500">
              {categoryIcon[product.category as ProductCategory](72)}
            </div>
          )}
        </div>

        {product.badge && (
          <span className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-[0.12em] bg-white/90 backdrop-blur-sm text-navy-900 px-3 py-1.5 rounded-full">
            {product.badge}
          </span>
        )}

        <a
          href={`/?product=${product.id}&service=${product.related_service}#contact`}
          className="absolute bottom-4 right-4 w-11 h-11 bg-navy-900 hover:bg-solar-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
          aria-label={`Inquire about ${product.name}`}
        >
          <ArrowUpRight size={17} className="text-white" />
        </a>
      </div>

      <div className="mt-4">
        <h3
          className="text-navy-900 font-bold text-[15px] leading-snug mb-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {product.name}
        </h3>
        <p className="text-slate-400 text-[12px] leading-relaxed">{product.specs}</p>
      </div>
    </motion.div>
  );
}

interface Props {
  products: Product[];
}

export default function ProductsPage({ products }: Props) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <Layout>
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 pt-28 pb-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Products</span>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Package size={28} className="text-white" />
            </div>
          </div>
          <h1
            className="text-white font-black text-4xl sm:text-5xl leading-tight mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Our Products
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl">
            Quality solar equipment sourced from trusted global brands — panels,
            batteries, inverters, charge controllers, and more.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <p className="text-[13px] text-slate-400 uppercase tracking-[0.2em] font-medium">Our Products</p>
          <h2
            className="text-navy-900 font-bold text-2xl sm:text-[1.75rem] max-w-sm leading-snug"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            We offer a range of quality solar products to choose&nbsp;from.
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-12">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {productCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ProductCategory | 'all')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-navy-900 border-navy-900 text-white'
                      : 'bg-white border-slate-200 text-navy-900 hover:border-navy-300'
                  }`}
                >
                  {cat.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No products in this category yet.</p>
          </div>
        )}

        <div className="mt-24 bg-navy-900 rounded-3xl px-5 py-10 sm:px-10 sm:py-14 text-center">
          <h2 className="text-white font-black text-2xl sm:text-3xl mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Not sure which product fits your system?
          </h2>
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Our team will assess your site and recommend the right equipment for your budget and energy needs — free of charge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/#contact" className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200">
              Get a Free Consultation <ArrowRight size={18} />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition-colors duration-200 text-sm">
              View our services →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 2: Update `app/products/page.tsx` to be a Server Component**

```typescript
import ProductsPage from '@/page-components/products/ProductsIndex';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import type { Product } from '@/types';

export default async function Products() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const products: Product[] = (data ?? []).map((p) => ({
    ...p,
    image_path: getPublicUrl('product-images', p.image_path),
  }));

  return <ProductsPage products={products} />;
}
```

- [ ] **Step 3: Run `npx tsc --noEmit` — should be zero errors now**

- [ ] **Step 4: Run `npm run dev` and verify both `/projects` and `/products` load correctly**

- [ ] **Step 5: Commit**

```bash
git add app/products/page.tsx page-components/products/ProductsIndex.tsx
git commit -m "feat: connect public products page to Supabase"
```

---

## Task 9: Admin auth — `lib/auth.ts` and `middleware.ts`

**Files:**
- Create: `lib/auth.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Generate the expected session token from env vars */
export function generateSessionToken(): string {
  return createHmac('sha256', process.env.SESSION_SECRET!)
    .update(process.env.ADMIN_PASSWORD!)
    .digest('hex');
}

/** Constant-time comparison to prevent timing attacks */
export function verifySessionToken(token: string): boolean {
  try {
    const expected = generateSessionToken();
    const a = Buffer.from(token.padEnd(64, '0'));
    const b = Buffer.from(expected.padEnd(64, '0'));
    return timingSafeEqual(a, b) && token.length === expected.length;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Create `middleware.ts` in the project root**

Middleware runs in Edge runtime — uses Web Crypto for HMAC verification.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'admin_session';

async function computeExpectedToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET!;
  const password = process.env.ADMIN_PASSWORD!;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(password));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  const isLogin = request.nextUrl.pathname.startsWith('/admin/login');

  if (isAdmin && !isLogin) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const expected = await computeExpectedToken();
    if (!safeEqual(token, expected)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts middleware.ts
git commit -m "feat: add admin auth utilities and middleware"
```

---

## Task 10: Admin login page

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/actions.ts`

- [ ] **Step 1: Create `app/admin/login/actions.ts`**

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, COOKIE_MAX_AGE, generateSessionToken, verifySessionToken } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login?error=1');
  }

  const token = generateSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  redirect('/admin');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
```

- [ ] **Step 2: Create `app/admin/login/page.tsx`**

```typescript
import { loginAction } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <h1
          className="text-navy-900 font-black text-2xl mb-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          JMC Solar Admin
        </h1>
        <p className="text-slate-500 text-sm mb-8">Enter your password to continue.</p>

        {searchParams.error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
            Incorrect password. Try again.
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-sm"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify auth works end to end**

Run `npm run dev`. Open `http://localhost:3000/admin` — should redirect to `/admin/login`.
Enter wrong password — should show error. Enter correct password — should redirect to `/admin` (404 for now, that's fine).

- [ ] **Step 4: Commit**

```bash
git add app/admin/
git commit -m "feat: add admin login page and auth action"
```

---

## Task 11: Admin layout and dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create `app/admin/layout.tsx`**

```typescript
import Link from 'next/link';
import { logoutAction } from './login/actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-black text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
            JMC Admin
          </span>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin/projects" className="text-white/70 hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/admin/products" className="text-white/70 hover:text-white transition-colors">
              Products
            </Link>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/page.tsx`**

```typescript
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-3xl mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Dashboard
      </h1>
      <p className="text-slate-500 text-sm mb-10">Manage your projects and products.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/admin/projects"
          className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy-300 transition-colors"
        >
          <h2 className="font-bold text-navy-900 text-lg mb-1">Projects</h2>
          <p className="text-slate-500 text-sm">Add, edit, and delete project entries with photos.</p>
        </Link>
        <Link
          href="/admin/products"
          className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy-300 transition-colors"
        >
          <h2 className="font-bold text-navy-900 text-lg mb-1">Products</h2>
          <p className="text-slate-500 text-sm">Manage your product catalog with images.</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify admin dashboard loads after login**

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat: add admin layout and dashboard"
```

---

## Task 12: Admin projects CRUD

**Files:**
- Create: `app/admin/projects/actions.ts`
- Create: `app/admin/projects/page.tsx`
- Create: `app/admin/projects/new/page.tsx`
- Create: `app/admin/projects/[id]/page.tsx`

- [ ] **Step 1: Create `app/admin/projects/actions.ts`**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function createProjectAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  const file = formData.get('cover_image') as File | null;
  let cover_image_path: string | null = null;

  if (file && file.size > 0) {
    const { data: project } = await supabase
      .from('projects')
      .insert({
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        system_size: (formData.get('system_size') as string) || null,
        description: (formData.get('description') as string) || null,
        location: (formData.get('location') as string) || null,
        facebook_url: (formData.get('facebook_url') as string) || null,
      })
      .select('id')
      .single();

    if (project) {
      const ext = file.name.split('.').pop();
      const path = `${project.id}/cover-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(path, file);

      if (!uploadError) {
        await supabase.from('projects').update({ cover_image_path: path }).eq('id', project.id);
        await supabase.from('project_images').insert({
          project_id: project.id,
          storage_path: path,
          display_order: 0,
        });
      }
    }
  } else {
    await supabase.from('projects').insert({
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      system_size: (formData.get('system_size') as string) || null,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      facebook_url: (formData.get('facebook_url') as string) || null,
      cover_image_path,
    });
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();

  await supabase.from('projects').update({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    system_size: (formData.get('system_size') as string) || null,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    facebook_url: (formData.get('facebook_url') as string) || null,
  }).eq('id', id);

  const file = formData.get('new_image') as File | null;
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop();
    const path = `${id}/img-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('project-images').upload(path, file);
    if (!error) {
      const setCover = formData.get('set_as_cover') === 'true';
      await supabase.from('project_images').insert({ project_id: id, storage_path: path, display_order: 0 });
      if (setCover) {
        await supabase.from('projects').update({ cover_image_path: path }).eq('id', id);
      }
    }
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function deleteProjectAction(id: string) {
  const supabase = createSupabaseAdminClient();
  // Fetch all image paths for cleanup
  const { data: images } = await supabase
    .from('project_images')
    .select('storage_path')
    .eq('project_id', id);

  if (images?.length) {
    await supabase.storage
      .from('project-images')
      .remove(images.map((i) => i.storage_path));
  }

  await supabase.from('projects').delete().eq('id', id);
  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function deleteImageAction(imageId: string, storagePath: string, projectId: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from('project-images').remove([storagePath]);
  await supabase.from('project_images').delete().eq('id', imageId);

  // If this was the cover, clear it
  const { data: project } = await supabase
    .from('projects')
    .select('cover_image_path')
    .eq('id', projectId)
    .single();
  if (project?.cover_image_path === storagePath) {
    await supabase.from('projects').update({ cover_image_path: null }).eq('id', projectId);
  }

  revalidatePath('/admin/projects');
  redirect(`/admin/projects/${projectId}`);
}

export async function setCoverAction(projectId: string, storagePath: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from('projects').update({ cover_image_path: storagePath }).eq('id', projectId);
  revalidatePath('/projects');
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}
```

- [ ] **Step 2: Create `app/admin/projects/page.tsx`**

```typescript
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteProjectAction } from './actions';

export default async function AdminProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, category, location, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-navy-900 font-black text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Projects
        </h1>
        <Link
          href="/admin/projects/new"
          className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Project
        </Link>
      </div>

      {!projects?.length ? (
        <p className="text-slate-400 text-sm">No projects yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900 text-sm">{p.title}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{p.category} · {p.location ?? 'No location'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-navy-900 text-sm font-medium hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteProjectAction.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="text-red-500 text-sm hover:underline"
                    onClick={(e) => {
                      if (!confirm('Delete this project and all its photos?')) e.preventDefault();
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/projects/new/page.tsx`**

```typescript
import { createProjectAction } from '../actions';

const categories = ['residential', 'commercial', 'industrial', 'agricultural', 'school'];

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        New Project
      </h1>

      <form action={createProjectAction} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input name="title" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">System Size</label>
          <input name="system_size" placeholder="e.g. 10 kWp" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input name="location" placeholder="e.g. Ormoc City, Leyte" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Post URL</label>
          <input name="facebook_url" type="url" placeholder="https://facebook.com/..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
          <input name="cover_image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Create Project
          </button>
          <a href="/admin/projects" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/projects/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import { updateProjectAction, deleteImageAction, setCoverAction } from '../actions';

const categories = ['residential', 'commercial', 'industrial', 'agricultural', 'school'];

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const [{ data: project }, { data: images }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase.from('project_images').select('*').eq('project_id', params.id).order('display_order'),
  ]);

  if (!project) notFound();

  const updateWithId = updateProjectAction.bind(null, params.id);

  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Edit Project
      </h1>

      {/* Edit form */}
      <form action={updateWithId} className="space-y-5 max-w-xl mb-12">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input name="title" defaultValue={project.title} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" defaultValue={project.category} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">System Size</label>
          <input name="system_size" defaultValue={project.system_size ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input name="location" defaultValue={project.location ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Post URL</label>
          <input name="facebook_url" type="url" defaultValue={project.facebook_url ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={project.description ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Add New Photo</label>
          <input name="new_image" type="file" accept="image/*" className="w-full text-sm" />
          <label className="flex items-center gap-2 mt-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" name="set_as_cover" value="true" />
            Set as cover image
          </label>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Save Changes
          </button>
          <a href="/admin/projects" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>

      {/* Photo gallery */}
      <div>
        <h2 className="font-bold text-navy-900 text-lg mb-4">Photos</h2>
        {!images?.length ? (
          <p className="text-slate-400 text-sm">No photos yet. Upload one above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => {
              const url = getPublicUrl('project-images', img.storage_path);
              const isCover = img.storage_path === project.cover_image_path;
              return (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200">
                  {url && <img src={url} alt="" className="w-full aspect-video object-cover" />}
                  {isCover && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-solar-500 text-white px-2 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                  <div className="flex gap-2 p-2">
                    {!isCover && (
                      <form action={setCoverAction.bind(null, params.id, img.storage_path)}>
                        <button type="submit" className="text-xs text-navy-900 hover:underline">Set cover</button>
                      </form>
                    )}
                    <form action={deleteImageAction.bind(null, img.id, img.storage_path, params.id)}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test projects CRUD end to end**

1. Go to `/admin/projects` — list loads
2. Click "+ New Project" — form appears, submit with a title and image
3. Verify: record in Supabase Table Editor, image in Storage browser
4. Click "Edit" on the project — form pre-filled
5. Upload a second image, check "Set as cover", save
6. Verify: cover image updated in DB
7. Delete an image — verify removed from Storage and DB
8. Delete the project — verify all images cleaned from Storage

- [ ] **Step 6: Commit**

```bash
git add app/admin/projects/
git commit -m "feat: add admin projects CRUD with photo upload"
```

---

## Task 13: Admin products CRUD

**Files:**
- Create: `app/admin/products/actions.ts`
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/page.tsx`

- [ ] **Step 1: Create `app/admin/products/actions.ts`**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

async function uploadProductImage(supabase: ReturnType<typeof createSupabaseAdminClient>, productId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${productId}/product-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  return error ? null : path;
}

export async function createProductAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  const { data: product } = await supabase
    .from('products')
    .insert({
      name: formData.get('name') as string,
      brand: (formData.get('brand') as string) || null,
      category: formData.get('category') as string,
      specs: (formData.get('specs') as string) || null,
      description: (formData.get('description') as string) || null,
      badge: (formData.get('badge') as string) || null,
      related_service: (formData.get('related_service') as string) || null,
    })
    .select('id')
    .single();

  if (product) {
    const file = formData.get('image') as File | null;
    if (file && file.size > 0) {
      const path = await uploadProductImage(supabase, product.id, file);
      if (path) {
        await supabase.from('products').update({ image_path: path }).eq('id', product.id);
      }
    }
  }

  revalidatePath('/products');
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function updateProductAction(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();

  const update: Record<string, string | null> = {
    name: formData.get('name') as string,
    brand: (formData.get('brand') as string) || null,
    category: formData.get('category') as string,
    specs: (formData.get('specs') as string) || null,
    description: (formData.get('description') as string) || null,
    badge: (formData.get('badge') as string) || null,
    related_service: (formData.get('related_service') as string) || null,
  };

  const file = formData.get('image') as File | null;
  if (file && file.size > 0) {
    const path = await uploadProductImage(supabase, id, file);
    if (path) update.image_path = path;
  }

  await supabase.from('products').update(update).eq('id', id);
  revalidatePath('/products');
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function deleteProductAction(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data: product } = await supabase.from('products').select('image_path').eq('id', id).single();
  if (product?.image_path) {
    await supabase.storage.from('product-images').remove([product.image_path]);
  }
  await supabase.from('products').delete().eq('id', id);
  revalidatePath('/products');
  revalidatePath('/admin/products');
  redirect('/admin/products');
}
```

- [ ] **Step 2: Create `app/admin/products/page.tsx`**

```typescript
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteProductAction } from './actions';

export default async function AdminProductsPage() {
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-navy-900 font-black text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Product
        </Link>
      </div>

      {!products?.length ? (
        <p className="text-slate-400 text-sm">No products yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900 text-sm">{p.name}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{p.brand} · {p.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/products/${p.id}`} className="text-navy-900 text-sm font-medium hover:underline">Edit</Link>
                <form action={deleteProductAction.bind(null, p.id)}>
                  <button type="submit" className="text-red-500 text-sm hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/products/new/page.tsx`**

```typescript
import { createProductAction } from '../actions';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        New Product
      </h1>

      <form action={createProductAction} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input name="name" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input name="brand" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Specs</label>
          <input name="specs" placeholder="e.g. 550W · Mono PERC" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
          <input name="badge" placeholder="e.g. Best Seller" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related Service</label>
          <select name="related_service" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            <option value="">None</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
          <input name="image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Create Product
          </button>
          <a href="/admin/products" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/products/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import { updateProductAction } from '../actions';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();

  if (!product) notFound();

  const updateWithId = updateProductAction.bind(null, params.id);
  const imageUrl = getPublicUrl('product-images', product.image_path);

  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Edit Product
      </h1>

      {imageUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Current Image</p>
          <img src={imageUrl} alt={product.name} className="w-40 h-40 object-contain rounded-xl border border-slate-200 bg-slate-50 p-2" />
        </div>
      )}

      <form action={updateWithId} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input name="name" defaultValue={product.name} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input name="brand" defaultValue={product.brand ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" defaultValue={product.category} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Specs</label>
          <input name="specs" defaultValue={product.specs ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={product.description ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
          <input name="badge" defaultValue={product.badge ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related Service</label>
          <select name="related_service" defaultValue={product.related_service ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            <option value="">None</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Replace Image</label>
          <input name="image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Save Changes
          </button>
          <a href="/admin/products" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Test products CRUD end to end**

1. Create a product with an image — verify in DB and Storage
2. Edit it — change name, replace image, verify old image is not deleted (acceptable), new image set
3. Delete product — verify image removed from Storage

- [ ] **Step 6: Commit**

```bash
git add app/admin/products/
git commit -m "feat: add admin products CRUD with image upload"
```

---

## Task 14: Seed existing data and delete static files

- [ ] **Step 1: Seed the 10 projects via the admin panel**

Go to `/admin/projects/new` and enter each project from `data/projects.ts`. Upload photos from `/public/projects/` as the cover image for any project that has one.

- [ ] **Step 2: Seed the 15 products via the admin panel**

Go to `/admin/products/new` and enter each product from `data/products.ts`. Skip image upload — no product images exist yet.

- [ ] **Step 3: Verify public pages show seeded data**

Open `/projects` and `/products` — should show the seeded records.

- [ ] **Step 4: Delete static data files**

```bash
rm data/projects.ts data/products.ts
```

- [ ] **Step 5: Run `npx tsc --noEmit` — should pass with zero errors**

- [ ] **Step 6: Run `npm run build` — should succeed**

```bash
npm run build
```

Expected: successful build output.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: remove static data files — all data now served from Supabase"
```
