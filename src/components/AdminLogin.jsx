import React, { useState } from 'react';
import { BookOpen, KeyRound, Mail, ChevronLeft, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // Success
      localStorage.setItem('artisite_admin_token', data.token);
      localStorage.setItem('artisite_admin_user', data.email);
      onLoginSuccess(data.token, data.email);
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-editorial-cream dark:bg-editorial-bg-dark transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-100 bg-white p-8 shadow-md dark:border-neutral-800 dark:bg-editorial-card-dark">
        {/* Back Link */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-editorial-gold dark:text-neutral-500 dark:hover:text-editorial-gold-light transition-colors focus:outline-none cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Gazette
          </button>
        </div>

        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-editorial-gold/10 text-editorial-gold dark:bg-editorial-gold/20 dark:text-editorial-gold-light">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-editorial-ink dark:text-neutral-100">
            Editor Login
          </h2>
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            Authenticate to manage essays, draft stories, and review metrics.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="editor@artisite.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-editorial-ink transition-all focus:border-editorial-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-editorial-gold dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-editorial-gold dark:focus:bg-neutral-900"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-neutral-400">
                  <KeyRound className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-11 text-sm text-editorial-ink transition-all focus:border-editorial-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-editorial-gold dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-editorial-gold dark:focus:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl bg-editorial-charcoal py-3 px-4 text-sm font-bold text-white transition-all hover:bg-editorial-gold disabled:bg-neutral-400 dark:bg-neutral-800 dark:hover:bg-editorial-gold dark:hover:text-neutral-900 cursor-pointer focus:outline-none"
            >
              {isLoading ? 'Authenticating...' : 'Sign In as Editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
