"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProjectAction } from "../actions";
import Link from "next/link";

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors";
const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

const categories = [
  "residential",
  "commercial",
  "industrial",
  "agricultural",
  "school",
];

type Project = {
  id: string;
  title: string;
  category: string;
  system_size: string | null;
  description: string | null;
  location: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  completed_at: string | null;
};

export default function EditProjectForm({ project }: { project: Project }) {
  const updateWithId = updateProjectAction.bind(null, project.id);
  const [state, formAction, isPending] = useActionState(updateWithId, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success("Project updated successfully");
      router.push("/admin/projects");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/projects"
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
          Edit Project
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-3xl mb-24">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form id="main-form" action={formAction} className="space-y-5">
          {/* Section: Basic Information */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Basic Information
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label htmlFor="title" className={labelCls}>
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={project.title ?? ""}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="category" className={labelCls}>
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={project.category ?? ""}
              className={inputCls}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className={labelCls}>
              Location
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g. Ormoc City, Leyte"
              defaultValue={project.location ?? ""}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="system_size" className={labelCls}>
              System Size
            </label>
            <input
              id="system_size"
              name="system_size"
              placeholder="e.g. 10 kWp"
              defaultValue={project.system_size ?? ""}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="completed_at" className={labelCls}>
              Date Completed
            </label>
            <input
              id="completed_at"
              name="completed_at"
              type="month"
              defaultValue={project.completed_at?.slice(0, 7) ?? ""}
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">
              Month and year the project was completed
            </p>
          </div>

          {/* Section: Details */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Details
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label htmlFor="description" className={labelCls}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project.description ?? ""}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="facebook_url" className={labelCls}>
              Facebook Post URL
            </label>
            <input
              id="facebook_url"
              name="facebook_url"
              type="url"
              placeholder="https://facebook.com/..."
              defaultValue={project.facebook_url ?? ""}
              className={inputCls}
            />
          </div>

          {/* Section: Media */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Media
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label htmlFor="new_image" className={labelCls}>
              Add New Photo
            </label>
            <input
              id="new_image"
              name="new_image"
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-solar-500/10 file:text-solar-600 file:font-medium hover:file:bg-solar-500/20 file:cursor-pointer"
            />
            <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm text-slate-600">
              <input
                type="checkbox"
                name="set_as_cover"
                value="true"
                className="w-4 h-4 accent-solar-500"
              />
              Set as cover image
            </label>
          </div>
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/projects"
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
          {isPending ? "Saving…" : "Update Project"}
        </button>
      </div>
    </div>
  );
}
