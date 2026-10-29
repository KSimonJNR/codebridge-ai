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
  Info,
  Copy
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
    callbackUrl,
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
  const [copiedCallback, setCopiedCallback] = useState(false);

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

  const handleCopyCallback = () => {
    if (callbackUrl && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(callbackUrl).then(() => {
        setCopiedCallback(true);
        setTimeout(() => setCopiedCallback(false), 2500);
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md card-71 p-6 sm:p-7 space-y-4 text-ink rounded-[16px]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-1 rounded-[8px] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Secure Cloud Sync</span>
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-ink-strong tracking-tight">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-[12px] text-ink-subtle">
            {mode === 'signin' && 'Sign in to sync your PR guides, roadmaps, and completed lessons across devices.'}
            {mode === 'signup' && 'Register to preserve your open-source learning journey in the cloud.'}
            {mode === 'reset' && 'Enter your email address to receive a secure password reset link.'}
          </p>
        </div>

        {/* Configuration Notice if VITE_SUPABASE_URL is unconfigured */}
        {!isConfigured && (
          <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/25 text-[12px] text-amber-500 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4 shrink-0" />
              <span>Supabase Environment Configuration Required</span>
            </div>
            <p className="leading-relaxed text-[11px] text-ink-subtle">
              To activate real cloud authentication, add your project credentials to <code className="font-mono text-ink">.env</code> or AI Studio Secrets:
            </p>
            <div className="font-mono text-[10px] bg-surface-2 p-2 rounded-[6px] border border-hairline space-y-0.5 text-ink">
              <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
            </div>
            <p className="text-[11px] text-ink-subtle">
              Anonymous local features and localStorage remain fully functional!
            </p>
          </div>
        )}

        {/* Error & Success Messages */}
        {error && (
          <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[12px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <span className="block font-medium">Authentication Error</span>
              <span className="block text-ink-subtle">{error}</span>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-1 text-accent hover:underline font-medium block cursor-pointer"
                >
                  Resend verification email &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[12px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
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
              className="w-full h-8 flex items-center justify-center gap-2 rounded-[10px] bg-surface-2 hover:bg-surface border border-hairline text-ink text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading || oauthLoading !== null}
              className="w-full h-8 flex items-center justify-center gap-2 rounded-[10px] bg-surface-2 hover:bg-surface border border-hairline text-ink text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

            {/* Supabase OAuth Redirect URL Whitelist Notice */}
            {callbackUrl && (
              <div className="p-2.5 rounded-[10px] bg-surface-2 border border-hairline text-[11px] space-y-1">
                <div className="flex items-center justify-between text-ink-subtle">
                  <span className="flex items-center gap-1 font-medium text-ink">
                    <Sparkles className="w-3 h-3 text-accent" />
                    Supabase Redirect URL
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="px-2 py-0.5 rounded-[6px] bg-surface hover:bg-surface-3 text-ink text-[10px] border border-hairline transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCallback ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-accent truncate select-all">
                  {callbackUrl}
                </div>
                <p className="text-[10px] text-ink-subtle leading-tight">
                  Add this to <strong>Supabase Dashboard &rarr; Authentication &rarr; URL Configuration &rarr; Redirect URLs</strong> to prevent localhost fallback errors.
                </p>
              </div>
            )}

            <div className="relative py-1 text-center text-[10px] text-ink-subtle">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-hairline" />
              </span>
              <span className="relative bg-surface px-3 font-medium uppercase">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink-subtle block">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-ink-subtle block">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-ink-subtle">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-8 mt-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[13px] font-medium disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <div className="pt-2 border-t border-hairline text-center text-[12px] text-ink-subtle">
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
                className="text-accent hover:underline font-medium cursor-pointer"
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
                className="text-accent hover:underline font-medium cursor-pointer"
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
                className="text-accent hover:underline font-medium cursor-pointer"
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
