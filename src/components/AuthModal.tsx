import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Github,
  KeyRound,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    sendPasswordReset,
    resendVerificationEmail,
    isConfigured,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode !== 'reset' && !password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await signInWithEmail(email, password);
        if (signInError) {
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            setNeedsVerification(true);
            setError('Please verify your email address before signing in.');
          } else {
            setError(signInError.message);
          }
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        const { error: signUpError, user } = await signUpWithEmail(email, password, fullName);
        if (signUpError) {
          setError(signUpError.message);
        } else if (user && !user.confirmed_at) {
          setNeedsVerification(true);
          setSuccessMessage(
            'Account created! A confirmation email has been sent. Please check your inbox to activate your account.'
          );
        } else {
          onClose();
        }
      } else if (mode === 'reset') {
        const { error: resetError } = await sendPasswordReset(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccessMessage(
            'Password reset link sent! Check your email inbox to create a new password.'
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setOauthLoading(provider);
    try {
      const { error: oauthErr } = await signInWithProvider(provider);
      if (oauthErr) {
        setError(oauthErr.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth sign in failed';
      setError(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resendErr } = await resendVerificationEmail(email);
      if (resendErr) {
        setError(resendErr.message);
      } else {
        setSuccessMessage('A fresh verification link has been sent to your email.');
      }
    } catch {
      setError('Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0c1222] to-[#070a13] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Secure Cloud Sync
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Sign in to sync your PR guides, roadmaps, and completed lessons across devices.'}
            {mode === 'signup' && 'Register to preserve your open-source learning journey in the cloud.'}
            {mode === 'reset' && 'Enter your email address to receive a secure password reset link.'}
          </p>
        </div>

        {/* Configuration Notice if VITE_SUPABASE_URL is unconfigured */}
        {!isConfigured && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Info className="w-4 h-4 shrink-0" />
              <span>Supabase Environment Configuration Required</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-200/90">
              To activate real cloud authentication, add your project credentials to <code className="font-mono text-cyan-300">.env</code> or AI Studio Secrets:
            </p>
            <div className="font-mono text-[10px] bg-black/50 p-2 rounded border border-white/5 space-y-0.5 text-slate-300">
              <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
            </div>
            <p className="text-[10px] text-amber-300/80">
              Anonymous local features and localStorage remain fully functional!
            </p>
          </div>
        )}

        {/* Error & Success Messages */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="block font-semibold">Authentication Error</span>
              <span className="block text-slate-300">{error}</span>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-1 text-cyan-400 hover:underline font-semibold block cursor-pointer"
                >
                  Resend verification email &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* OAuth Buttons (Only shown for signin/signup) */}
        {mode !== 'reset' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>{oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>OAuth is used strictly for identity. Zero private repo scopes requested.</span>
            </div>

            <div className="relative py-2 text-center text-xs text-slate-500">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </span>
              <span className="relative bg-[#0c1222] px-3 font-semibold uppercase text-[10px]">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Free Account'}
                  {mode === 'reset' && 'Send Reset Email'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher Footer */}
        <div className="pt-2 border-t border-white/5 text-center text-xs text-slate-400">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Return to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
