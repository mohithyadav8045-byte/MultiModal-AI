import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_SERVICE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.trim() !== '' &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey &&
  supabaseAnonKey.trim() !== ''
);

/**
 * Client-side Supabase instance (uses anonymous key, enforces RLS policies)
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'omnidoc_supabase_auth'
      }
    })
  : null;

/**
 * Storage helper for client-side multimodal uploads
 */
export const supabaseStorage = {
  uploadFile: async (bucketName, path, file) => {
    if (!supabase) throw new Error('Supabase client is not configured.');
    return await supabase.storage.from(bucketName).upload(path, file, {
      upsert: true
    });
  },
  getPublicUrl: (bucketName, path) => {
    if (!supabase) return null;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data?.publicUrl || null;
  }
};

export default {
  supabase,
  isConfigured: () => isSupabaseConfigured,
  url: supabaseUrl,
  anonKey: supabaseAnonKey
};
