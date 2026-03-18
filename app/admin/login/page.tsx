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
