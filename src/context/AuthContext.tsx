import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseAnonKey,
  reconfigureSupabase,
  getAuthCallbackUrl,
  getRuntimeOrigin
} from '../lib/supabase.ts';
import {
  loadCloudProgress,
  saveCloudProgressItem,
  getLocalProgressSnapshot,
  mergeProgressData,
  applyMergedProgressToLocal
} from '../lib/progressSync.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  callbackUrl: string;
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
  const [configured, setConfigured] = useState<boolean>(isSupabaseConfigured());
  const initialSyncAttempted = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    if (!isSupabaseConfigured()) return;
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
  }, []);

  // Automatically merges cloud and local progress non-destructively upon sign-in
  const syncUserProgress = useCallback(async (userId: string) => {
    if (!userId || initialSyncAttempted.current === userId) return;
    initialSyncAttempted.current = userId;

    try {
      const { data: cloudData, error } = await loadCloudProgress(userId);
      if (error) {
        console.warn('[CloudSync] Could not fetch remote progress:', error);
        return;
      }

      const localData = getLocalProgressSnapshot();
      const merged = mergeProgressData(cloudData || {}, localData);
      applyMergedProgressToLocal(merged);

      // Backfill any non-empty local fields that are missing in cloud
      for (const [key, val] of Object.entries(localData)) {
        const cloudVal = cloudData ? cloudData[key] : undefined;
        const shouldBackfill =
          (val && !cloudVal) ||
          (Array.isArray(val) && val.length > 0 && (!Array.isArray(cloudVal) || val.length > cloudVal.length)) ||
          (typeof val === 'object' && val !== null && Object.keys(val).length > 0 && (!cloudVal || Object.keys(cloudVal).length === 0));

        if (shouldBackfill) {
          saveCloudProgressItem(userId, key, val).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[CloudSync] Background sync encountered a transient issue:', e);
    }
  }, []);

  // Clean OAuth hash/query parameters from URL after exchange
  const cleanUrlTokens = () => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
  };

  // Self-heal configuration if server has env vars not yet visible to client bundle
  useEffect(() => {
    if (!configured) {
      fetch('/api/supabase/config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.configured && data.supabaseUrl && data.supabaseAnonKey) {
            reconfigureSupabase(data.supabaseUrl, data.supabaseAnonKey);
            setConfigured(true);
          }
        })
        .catch(() => {});
    }
  }, [configured]);

  // Dynamic callback URL based on actual runtime origin
  const callbackUrl = getAuthCallbackUrl();

  // Centralized OAuth payload processor for tokens and PKCE codes
  const handleAuthCallbackPayload = useCallback(async (payload: { hash?: string; search?: string; error?: string | null }) => {
    if (!payload) return;

    if (payload.error) {
      console.warn('[Supabase OAuth] Received error from callback:', payload.error);
      return;
    }

    const hash = payload.hash || '';
    const search = payload.search || '';

    // Check for error in query or hash
    const searchParams = new URLSearchParams(search.replace(/^\?/, ''));
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const errorDesc = searchParams.get('error_description') || searchParams.get('error') || hashParams.get('error_description') || hashParams.get('error');

    if (errorDesc) {
      console.warn('[Supabase OAuth] OAuth error in URL parameters:', errorDesc);
      return;
    }

    // 1. Implicit tokens (hash fragments): access_token & refresh_token
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (data?.session && !error) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id, data.session.user.email);
          syncUserProgress(data.session.user.id);
          cleanUrlTokens();
        }
      } catch (e) {
        console.warn('Failed to restore session from OAuth hash tokens:', e);
      }
      return;
    }

    // 2. PKCE authorization code (?code=...)
    const code = searchParams.get('code');
    if (code) {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.session && !error) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id, data.session.user.email);
          syncUserProgress(data.session.user.id);
          cleanUrlTokens();
        }
      } catch (e) {
        console.warn('Failed to exchange authorization code from OAuth callback:', e);
      }
    }
  }, [fetchProfile, syncUserProgress]);

  // Multi-channel listener for popup/redirect completion
  useEffect(() => {
    // 1. PostMessage handler (popups)
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SUPABASE_OAUTH_CALLBACK') {
        handleAuthCallbackPayload(event.data);
      }
    };
    window.addEventListener('message', handleAuthMessage);

    // 2. BroadcastChannel handler (cross-tab/cross-window in modern browsers)
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('codebridge_oauth_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'SUPABASE_OAUTH_CALLBACK') {
            handleAuthCallbackPayload(event.data);
          }
        };
      }
    } catch {}

    // 3. Storage event listener (syncs across tabs even when window.opener is stripped)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'codebridge_oauth_callback' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          handleAuthCallbackPayload(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Direct URL inspection on mount (for mobile single-tab direct redirects)
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash || '';
      const currentSearch = window.location.search || '';
      if (currentHash.includes('access_token') || currentSearch.includes('code=')) {
        handleAuthCallbackPayload({ hash: currentHash, search: currentSearch });
      }
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorageEvent);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [handleAuthCallbackPayload]);

  // Supabase Auth lifecycle
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
        syncUserProgress(initialSession.user.id);
        cleanUrlTokens();
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email);
          syncUserProgress(newSession.user.id);
          cleanUrlTokens();
        } else {
          setProfile(null);
          initialSyncAttempted.current = null;
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile, syncUserProgress]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
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
    if (!isSupabaseConfigured()) {
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
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or AI Studio Secrets.'
        ) as unknown as AuthError,
      };
    }

    // Verify provider is enabled in Supabase project to give friendly in-app instructions
    try {
      const checkRes = await fetch(`/api/supabase/provider-status?provider=${provider}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.enabled === false) {
          const providerName = provider === 'google' ? 'Google' : 'GitHub';
          return {
            error: new Error(
              `${providerName} OAuth is not enabled in your Supabase project yet. In your Supabase Dashboard, go to Authentication -> Providers -> ${providerName}, toggle it on, and configure your Client ID and Client Secret.`
            ) as unknown as AuthError,
          };
        }
      }
    } catch {
      // Continue if server status check is unreachable
    }

    const redirectTo = callbackUrl;
    const anonKey = getSupabaseAnonKey();

    // Use skipBrowserRedirect: true so iframe navigation is not blocked
    const res = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        // GitHub: request only read user profile identity without repository access
        scopes: provider === 'github' ? 'read:user user:email' : undefined,
        // Explicitly attach apikey parameter to the authorization URL query
        queryParams: anonKey ? { apikey: anonKey } : undefined,
      },
    });

    if (res.error) {
      let friendlyMessage = res.error.message;
      if (friendlyMessage.includes('provider is not enabled') || friendlyMessage.includes('validation_failed')) {
        const providerName = provider === 'google' ? 'Google' : 'GitHub';
        friendlyMessage = `${providerName} sign-in is not enabled in your Supabase project yet. Go to Authentication -> Providers -> ${providerName} in your Supabase Dashboard to enable it.`;
      } else if (friendlyMessage.includes('No API key found')) {
        friendlyMessage = 'Supabase API key was not recognized. Please check that VITE_SUPABASE_ANON_KEY matches the anon public key in your Supabase Project Settings -> API.';
      }
      return {
        error: new Error(friendlyMessage) as unknown as AuthError,
      };
    }

    if (res.data?.url) {
      const width = 600;
      const height = 720;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        res.data.url,
        `supabase_oauth_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup was blocked by browser
        return {
          error: new Error(
            'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
          ) as unknown as AuthError,
        };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setProfile(null);
      setSession(null);
      initialSyncAttempted.current = null;
      return { error: null };
    }
    const res = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    initialSyncAttempted.current = null;
    return { error: res.error };
  };

  const sendPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase credentials are not configured.') as unknown as AuthError,
      };
    }

    const runtimeOrigin = getRuntimeOrigin();
    const redirectTo = runtimeOrigin
      ? `${runtimeOrigin}/?tab=account&reset=true`
      : undefined;

    const res = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    return { error: res.error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured()) {
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
    if (!isSupabaseConfigured()) {
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
        callbackUrl,
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
