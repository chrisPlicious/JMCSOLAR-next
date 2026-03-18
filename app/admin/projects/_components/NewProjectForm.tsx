'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '../actions';
import Link from 'next/link';

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

const categories = ['residential', 'commercial', 'industrial', 'agricultural', 'school'];

export default function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push('/admin/projects');
    }
  }, [state?.success, router]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-display font-black text-navy-950 text-2xl">New Project</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-2xl">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          {/* Section 1 — Project Details */}
          <p className={labelCls}>Project Details</p>

          <div>
            <label htmlFor="title" className={labelCls}>Title</label>
            <input id="title" name="title" required className={inputCls} />
          </div>

          <div>
            <label htmlFor="category" className={labelCls}>Category</label>
            <select id="category" name="category" required className={inputCls}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="system_size" className={labelCls}>System Size</label>
            <input id="system_size" name="system_size" placeholder="e.g. 10 kWp" className={inputCls} />
          </div>

          <hr className="border-slate-100 my-6" />

          {/* Section 2 — Location & Links */}
          <p className={labelCls}>Location &amp; Links</p>

          <div>
            <label htmlFor="location" className={labelCls}>Location</label>
            <input id="location" name="location" placeholder="e.g. Ormoc City, Leyte" className={inputCls} />
          </div>

          <div>
            <label htmlFor="facebook_url" className={labelCls}>Facebook Post URL</label>
            <input id="facebook_url" name="facebook_url" type="url" placeholder="https://facebook.com/..." className={inputCls} />
          </div>

          <hr className="border-slate-100 my-6" />

          {/* Section 3 — Description */}
          <p className={labelCls}>Description</p>

          <div>
            <label htmlFor="description" className={labelCls}>Description</label>
            <textarea id="description" name="description" rows={4} className={inputCls} />
          </div>

          <hr className="border-slate-100 my-6" />

          {/* Section 4 — Cover Photo */}
          <p className={labelCls}>Cover Photo</p>

          <div>
            <label htmlFor="cover_image" className={labelCls}>Cover Photo</label>
            <input
              id="cover_image"
              name="cover_image"
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-solar-500/10 file:text-solar-600 file:font-medium hover:file:bg-solar-500/20 file:cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-solar-500 hover:bg-solar-600 disabled:opacity-60 text-navy-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {isPending ? 'Creating…' : 'Create Project'}
            </button>
            <Link
              href="/admin/projects"
              className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
