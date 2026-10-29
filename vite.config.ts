import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeSupabaseUrl(rawUrl: string): string {
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

function normalizeSupabaseKey(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const rawKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = normalizeSupabaseKey(rawKey);

  const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');

  const htmlEnvPlugin: Plugin = {
    name: 'html-env-transform',
    transformIndexHtml(html: string) {
      const envScript = `<script>
        window.__ENV__ = {
          VITE_SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
          VITE_SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
          APP_URL: ${JSON.stringify(appUrl)}
        };
      </script>`;
      return html.replace('</head>', `${envScript}\n  </head>`);
    },
  };

  return {
    plugins: [react(), tailwindcss(), htmlEnvPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.APP_URL': JSON.stringify(appUrl),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
