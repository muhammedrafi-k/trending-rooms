import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function isSecretKey(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (
    trimmed.startsWith('sbp_') ||
    trimmed.startsWith('sb_secret_') ||
    trimmed.includes('service_role') ||
    trimmed.includes('service_key')
  ) {
    return true;
  }
  try {
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      if (decoded && decoded.role && decoded.role !== 'anon') {
        return true;
      }
    }
  } catch (e) {
    // Ignore invalid JWT format parsing errors
  }
  return false;
}

export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // If missing protocol (e.g., 'abcdefgh.supabase.co'), default to 'https://'
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Upgrade http:// to https:// to prevent Mixed Content blocking in HTTPS iframe
  if (url.startsWith('http://')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // Strip trailing slashes, subpaths, and origin extra paths
  try {
    const parsed = new URL(url);
    url = parsed.origin;
  } catch (e) {
    url = url.replace(/\/(rest|auth|realtime)(\/v\d+)?\/?$/i, '');
    url = url.replace(/\/+$/g, '');
  }

  return url;
}

export function getSupabaseConfig() {
  const metaEnv = (import.meta as Record<string, any>).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
  const localKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');

  const rawUrl = (localUrl || envUrl || '').trim();
  const url = cleanSupabaseUrl(rawUrl);
  const key = (localKey || envKey || '').trim();
  const isSecret = isSecretKey(key);

  return {
    url,
    key,
    isSecret,
    isConnected: Boolean(url && key && /^https?:\/\//i.test(url) && key.length > 10 && !isSecret),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (config.isSecret || !config.isConnected) {
    supabaseInstance = null;
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url && key) {
    const cleanedUrl = cleanSupabaseUrl(url);
    localStorage.setItem('CUSTOM_SUPABASE_URL', cleanedUrl);
    localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', key.trim());
  } else {
    localStorage.removeItem('CUSTOM_SUPABASE_URL');
    localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
  }
  supabaseInstance = null;
}

export const setSupabaseConfig = saveSupabaseConfig;
export function resetSupabaseConfig() {
  saveSupabaseConfig('', '');
}


