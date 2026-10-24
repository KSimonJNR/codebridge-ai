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

// Read raw environment variables injected by Vite
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

// Cleaned project origin and anon key
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = normalizeSupabaseKey(rawKey);

export const getSupabaseUrl = (): string => supabaseUrl;
export const getSupabaseAnonKey = (): string => supabaseAnonKey;

/**
 * Returns true if real, valid Supabase public credentials have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseUrl.includes('unconfigured.supabase.co') &&
    supabaseAnonKey !== 'your_supabase_anon_key_here' &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    supabaseAnonKey !== 'placeholder_anon_key' &&
    supabaseAnonKey.length >= 20
  );
};

// Safe fallback credentials so the client can initialize without throwing fatal errors if unconfigured
const fallbackUrl = 'https://unconfigured.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key';

const targetUrl = isSupabaseConfigured() ? supabaseUrl : fallbackUrl;
const targetKey = isSupabaseConfigured() ? supabaseAnonKey : fallbackKey;

export const supabase: SupabaseClient = createClient(
  targetUrl,
  targetKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        // Explicitly attach apikey header to all requests across PostgREST, Auth, and Storage
        apikey: targetKey,
      },
    },
  }
);
