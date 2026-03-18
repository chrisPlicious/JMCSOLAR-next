import { loginAction } from './actions';

const SunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="4" fill="currentColor" />
    <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="11" y1="18" x2="11" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="1" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="3.929" y1="3.929" x2="6.05" y2="6.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="15.95" y1="15.95" x2="18.071" y2="18.071" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.071" y1="3.929" x2="15.95" y2="6.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="6.05" y1="15.95" x2="3.929" y2="18.071" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#0a1428',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-2xl">
        {/* Icon badge */}
        <div className="bg-solar-500 w-10 h-10 rounded-xl flex items-center justify-center text-navy-950 mb-6">
          <SunIcon />
        </div>

        {/* Heading */}
        <h1 className="font-display font-black text-navy-950 text-2xl mb-1">
          JMC Solar Admin
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Enter password to access the control panel
        </p>

        {/* Error */}
        {params.error && (
          <div className="mb-6 px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-full text-center font-medium">
            Incorrect password. Please try again.
          </div>
        )}

        {/* Form */}
        <form action={loginAction} className="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-shadow"
          />
          <button
            type="submit"
            className="w-full bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold py-3 rounded-xl transition-colors duration-200 text-sm"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
