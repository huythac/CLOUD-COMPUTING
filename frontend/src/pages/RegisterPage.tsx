import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function inputCls(err: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors',
    err
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
  ].join(' ');
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username is required';
    else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) errs.username = 'Only letters, numbers, and underscores allowed';

    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Please enter a valid email';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, val: string, setter: (v: string) => void) {
    setter(val);
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">Start managing your customers today</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => set('username', e.target.value, setUsername)}
                placeholder="e.g. john_doe"
                autoComplete="username"
                className={inputCls(!!errors.username)}
              />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => set('email', e.target.value, setEmail)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputCls(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              <p className="mt-1 text-xs text-slate-400">Used for password recovery</p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => set('password', e.target.value, setPassword)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={inputCls(!!errors.password) + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value, setConfirmPassword)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={inputCls(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
