import { Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { loginAction } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  // H4: validate next before forwarding to prevent open redirect
  const nextPath =
    params.next && params.next.startsWith('/admin/') && !params.next.includes('..')
      ? params.next
      : undefined;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-card border border-line p-10 w-full max-w-sm shadow-elevated">
        {/* Icon badge */}
        <div className="bg-solar-500 w-10 h-10 rounded-control flex items-center justify-center text-navy-950 mb-6">
          <Sun size={22} aria-hidden />
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-black text-fg mb-1">
          JMC Solar Admin
        </h1>
        <p className="text-fg-muted text-sm mb-8">
          Enter password to access the control panel
        </p>

        {/* Error */}
        {params.error === '1' && (
          <div role="alert" className="mb-6 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-control text-center font-medium">
            Incorrect password. Please try again.
          </div>
        )}
        {params.error === '2' && (
          <div role="alert" className="mb-6 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-control text-center font-medium">
            Too many attempts. Please wait 15 minutes before trying again.
          </div>
        )}

        {/* Form */}
        <form action={loginAction} className="space-y-4">
          {/* H4: forward intended path so action can redirect back after auth */}
          {nextPath && <input type="hidden" name="next" value={nextPath} />}
          <Field id="admin-password" label="Password" required>
            <Input type="password" name="password" placeholder="Password" autoComplete="current-password" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-fg-muted select-none cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-300 accent-solar-500"
            />
            Remember me for 30 days
          </label>
          <Button type="submit" fullWidth>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
