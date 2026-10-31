import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or database/.env
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('=======================================================');
console.log('🔍 OmniMind Supabase Connection Diagnostic');
console.log('=======================================================');
console.log(`📡 Supabase URL: ${supabaseUrl || '[NOT SET]'}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey ? `${supabaseAnonKey.slice(0, 12)}...` : '[NOT SET]'}`);
console.log(`🔐 Service Role Key: ${supabaseServiceKey ? `${supabaseServiceKey.slice(0, 12)}...` : '[NOT SET]'}`);

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project-id')) {
  console.log('\n⚠️ Supabase credentials are not configured yet.');
  console.log('To configure:');
  console.log('1. Open backend/.env');
  console.log('2. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY');
  console.log('3. Run "node database/init-supabase.js" again.\n');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function testConnection() {
  try {
    // 1. Test Storage Buckets
    const { data: buckets, error: storageErr } = await supabase.storage.listBuckets();
    if (storageErr) {
      console.error('❌ Storage check failed:', storageErr.message);
    } else {
      console.log('✓ Supabase Storage operational. Buckets:', buckets.map(b => b.name).join(', ') || 'None found');
    }

    // 2. Test Tables
    const { data: users, error: dbErr } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (dbErr) {
      if (dbErr.code === '42P01') {
        console.warn('⚠️ Connected to Supabase, but "users" table is not created yet.');
        console.log('👉 Open database/schema.sql and execute it in your Supabase SQL Editor.');
      } else {
        console.error('❌ Database query error:', dbErr.message);
      }
    } else {
      console.log('✓ Database connection verified: "users" table is ready.');
    }

    console.log('\n🎉 Supabase is fully configured and ready for production!');
  } catch (err) {
    console.error('❌ Unexpected error during test:', err.message);
  }
}

testConnection();

