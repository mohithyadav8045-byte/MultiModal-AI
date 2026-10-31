import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

// Ensure WebSocket polyfill for Node.js < 22
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.trim() !== '' && 
  !supabaseUrl.includes('your-project-id') &&
  (supabaseAnonKey || supabaseServiceKey)
);

if (isSupabaseConfigured) {
  console.log(`[Supabase Service] Configured with URL: ${supabaseUrl}`);
} else {
  console.warn('[Supabase Service] Operating in local mode. To connect Supabase, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

/**
 * Standard Supabase client (using anon key, enforces RLS)
 */
export const supabase = isSupabaseConfigured && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : null;

/**
 * Admin Supabase client (using service role key, bypasses RLS for enterprise background jobs & storage admin)
 */
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOptions)
  : supabase;

export default {
  supabase,
  supabaseAdmin,
  isConfigured: () => isSupabaseConfigured,
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey
};
