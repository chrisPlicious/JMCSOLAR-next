import type { DbService } from '@/lib/supabase/types';
import Link from 'next/link';

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
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

type ServiceFormProps = {
  service?: DbService;
  action: (fd: FormData) => Promise<void>;
};

export default function ServiceForm({ service, action }: ServiceFormProps) {
  const isEdit = Boolean(service);

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

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-2xl">
        <form action={action} className="space-y-5">
          <div>
            <label className={labelCls}>
              Icon <span className="text-red-400">*</span>
            </label>
            <select name="icon" required defaultValue={service?.icon ?? 'Sun'} className={inputCls}>
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={service?.title ?? ''}
              className={inputCls}
            />
          </div>

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

          <div>
            <label className={labelCls}>Display Order</label>
            <input
              name="display_order"
              type="number"
              defaultValue={service?.display_order ?? 0}
              className={inputCls}
            />
          </div>

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

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {isEdit ? 'Update Service' : 'Create Service'}
            </button>
            <Link
              href="/admin/services"
              className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
