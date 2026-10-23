import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    if (!configured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setProfile({
          id: data.id,
          email: data.email || email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        });
      } else {
        // Fallback profile if table row is still creating via trigger
        setProfile({
          id: userId,
          email: email || '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // In case of network error, preserve minimal profile
      setProfile({
        id: userId,
        email: email || '',
        createdAt: new Date().toISOString(),
      });
    }
  }, [configured]);

  // Clean OAuth hash/query parameters from URL after exchange
  const cleanUrlTokens = () => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial Session Restoration
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (initialSession && !error) {
        setSession(initialSession);
        setUser(initialSession.user);
        fetchProfile(initialSession.user.id, initialSession.user.email);
        cleanUrlTokens();
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email);
          cleanUrlTokens();
        } else {
          setProfile(null);
        }

        if (event === 'PASSWORD_RECOVERY') {
          // Flag recovery mode
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ) as unknown as AuthError,
      };
    }
    const res = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: res.error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ) as unknown as AuthError,
        user: null,
      };
    }

    const res = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || '',
        },
      },
    });

    return { error: res.error, user: res.data.user };
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ) as unknown as AuthError,
      };
    }

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const res = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // GitHub: request only read user profile identity without repository access
        scopes: provider === 'github' ? 'read:user user:email' : undefined,
      },
    });

    return { error: res.error };
  };

  const signOut = async () => {
    if (!configured) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: null };
    }
    const res = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    return { error: res.error };
  };

  const sendPasswordReset = async (email: string) => {
    if (!configured) {
      return {
        error: new Error('Supabase credentials are not configured.') as unknown as AuthError,
      };
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/?tab=account&reset=true`
      : undefined;

    const res = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    return { error: res.error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!configured) {
      return {
        error: new Error('Supabase credentials are not configured.') as unknown as AuthError,
      };
    }

    const res = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error: res.error };
  };

  const resendVerificationEmail = async (email: string) => {
    if (!configured) {
      return {
        error: new Error('Supabase credentials are not configured.') as unknown as AuthError,
      };
    }

    const res = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });

    return { error: res.error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signInWithProvider,
        signOut,
        sendPasswordReset,
        updatePassword,
        resendVerificationEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
