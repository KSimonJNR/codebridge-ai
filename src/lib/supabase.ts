import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes user-supplied Supabase URL to extract strictly the origin
 * (e.g. stripping accidental `/rest/v1`, `/rest`, trailing slashes, or quotes).
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let cleaned = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned) return '';
  try {
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
}

/**
 * Normalizes user-supplied Supabase key (strips quotes and whitespace).
 */
export function normalizeSupabaseKey(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
}

// Read raw environment variables injected by Vite transformIndexHtml or import.meta.env
function getRawUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_URL) {
    return String((window as any).__ENV__.VITE_SUPABASE_URL);
  }
  return (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
}

function getRawKey(): string {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY) {
    return String((window as any).__ENV__.VITE_SUPABASE_ANON_KEY);
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
}

// Cleaned project origin and anon key
let currentUrl = normalizeSupabaseUrl(getRawUrl());
let currentKey = normalizeSupabaseKey(getRawKey());

export const getSupabaseUrl = (): string => currentUrl;
export const getSupabaseAnonKey = (): string => currentKey;

/**
 * Safely extracts the current runtime origin in the browser or AI Studio environment,
 * strictly without hardcoded localhost defaults.
 */
export function getRuntimeOrigin(): string {
  if (typeof window !== 'undefined') {
    if (window.location?.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
      return window.location.origin;
    }
    if ((window as any).__ENV__?.APP_URL) {
      return String((window as any).__ENV__.APP_URL).replace(/\/+$/, '');
    }
  }
  return '';
}

/**
 * Returns the exact OAuth callback URL dynamically derived from the runtime origin.
 */
export function getAuthCallbackUrl(): string {
  const origin = getRuntimeOrigin();
  return origin ? `${origin}/auth/callback` : '/auth/callback';
}

/**
 * Returns true if real, valid Supabase public credentials have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = currentUrl || normalizeSupabaseUrl(getRawUrl());
  const key = currentKey || normalizeSupabaseKey(getRawKey());
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project-id') &&
    !url.includes('unconfigured.supabase.co') &&
    key !== 'your_supabase_anon_key_here' &&
    key !== 'YOUR_SUPABASE_ANON_KEY' &&
    key !== 'placeholder_anon_key' &&
    key.length >= 20
  );
};

// Safe fallback credentials so the client can initialize without throwing fatal errors if unconfigured
const fallbackUrl = 'https://unconfigured.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';

function createSupabaseInstance(url: string, key: string): SupabaseClient {
  const targetUrl = url || fallbackUrl;
  const targetKey = key || fallbackKey;
  return createClient(targetUrl, targetKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        // Explicitly attach apikey header to all requests across PostgREST, Auth, and Storage
        apikey: targetKey,
      },
    },
  });
}

export let supabase: SupabaseClient = createSupabaseInstance(
  isSupabaseConfigured() ? currentUrl : fallbackUrl,
  isSupabaseConfigured() ? currentKey : fallbackKey
);

/**
 * Dynamically updates Supabase client credentials (e.g. after fetching from server config).
 */
export function reconfigureSupabase(url: string, key: string): boolean {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = normalizeSupabaseKey(key);
  if (!cleanUrl || !cleanKey) return false;

  currentUrl = cleanUrl;
  currentKey = cleanKey;
  if (typeof window !== 'undefined') {
    (window as any).__ENV__ = (window as any).__ENV__ || {};
    (window as any).__ENV__.VITE_SUPABASE_URL = cleanUrl;
    (window as any).__ENV__.VITE_SUPABASE_ANON_KEY = cleanKey;
  }

  supabase = createSupabaseInstance(cleanUrl, cleanKey);
  return true;
}
