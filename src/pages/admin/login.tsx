import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const { login, resetPassword } = useAuth();
  const [, setLocation] = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  const passwordStrength = useCallback((pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  }, []);

  const strength = password ? passwordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      setLocation('/admin');
    } else {
      setError(result.error || 'Invalid email or password provided. Please check credentials.');
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    const result = await resetPassword(resetEmail, `${window.location.origin}/admin/settings`);
    if (result.success) {
      setResetSuccess(true);
    } else {
      setResetError(result.error || 'Failed to send reset email. Please try again.');
    }
    setResetLoading(false);
  };

  // Forgot password form
  if (resetMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-navy-900 bg-navy-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="font-display font-bold text-2xl">M</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900">
              Reset Password
            </h1>
            <p className="text-navy-500 mt-1">Enter your registered email to receive a password reset link</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            {resetSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-navy-700 font-medium">Check your email</p>
                <p className="text-sm text-navy-500">
                  We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>.
                  Check your inbox and follow the instructions.
                </p>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSuccess(false); }}
                  className="btn-primary w-full mt-4"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {resetError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {resetError}
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-navy-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-300" />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="Enter your registered email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary w-full"
                >
                  {resetLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetError(''); }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-navy-500 hover:text-navy-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </button>
          <div className="w-16 h-16 rounded-full border-2 border-navy-900 bg-navy-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="font-display font-bold text-2xl">M</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            MEGGS KITCHEN
          </h1>
          <p className="text-navy-600 text-sm font-medium mt-1">Owner & Staff Portal</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-navy-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-300" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="name@meggskitchen.com"
                  required
                  autoComplete="username"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-navy-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-300" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your account password"
                  required
                  autoComplete="current-password"
                  aria-describedby={strength ? 'password-strength' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {strength && (
                <div id="password-strength" className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    strength.score <= 1 ? 'text-red-600' :
                    strength.score <= 2 ? 'text-orange-600' :
                    strength.score <= 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  defaultChecked
                />
                <span className="text-sm text-navy-600">Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => { setResetMode(true); setResetEmail(email); }}
                className="text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-navy-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Protected by Supabase Authentication & PostgreSQL RLS</span>
            </p>
          </div>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          MEGGS KITCHEN Platform • Secure Enterprise Authentication
        </p>
      </div>
    </div>
  );
}
