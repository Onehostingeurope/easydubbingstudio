import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-[#e2e2e8] flex items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="font-bold text-3xl text-primary tracking-tight">Easy Dubbing</h1>
          </Link>
          <p className="text-on-surface-variant text-sm mt-2 font-technical">Studio Console Login</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative">
          <h2 className="text-xl font-bold mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/10 border border-error/20 text-error text-xs font-technical">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-technical text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3 pl-10 pr-4 text-on-surface transition-all focus:outline-none focus:border-tertiary focus:ring-4 focus:ring-tertiary/10"
                />
              </div>
            </div>

            <div>
              <label className="block font-technical text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl py-3 pl-10 pr-4 text-on-surface transition-all focus:outline-none focus:border-tertiary focus:ring-4 focus:ring-tertiary/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full primary-btn py-3.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 duration-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
