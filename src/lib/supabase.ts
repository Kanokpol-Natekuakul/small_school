import { createClient } from '@supabase/supabase-js';

export type BackendMode = 'auto' | 'supabase' | 'mock';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const backendModeEnv = (import.meta.env.VITE_BACKEND_MODE || 'auto').toLowerCase();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const backendMode: BackendMode =
  backendModeEnv === 'supabase' || backendModeEnv === 'mock' || backendModeEnv === 'auto'
    ? backendModeEnv
    : 'auto';

export const isSupabaseBackend = backendMode === 'supabase' || (backendMode === 'auto' && hasSupabaseConfig);
export const backendRuntimeMode = isSupabaseBackend ? 'supabase' : 'mock';

const createMissingSupabaseClient = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Supabase backend mode is enabled but VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are missing or invalid.'
        );
      }
    }
  ) as ReturnType<typeof createClient>;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingSupabaseClient();

export const createTempClient = () => {
  if (!hasSupabaseConfig) return createMissingSupabaseClient();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};

export const backendModeLabel =
  backendMode === 'auto'
    ? `auto (${backendRuntimeMode})`
    : backendMode === 'supabase'
      ? hasSupabaseConfig
        ? 'supabase'
        : 'supabase (missing env, fallback blocked)'
      : 'mock';
