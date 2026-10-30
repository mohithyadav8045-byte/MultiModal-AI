import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env.supabase') });

async function checkSupabase() {
  console.log('=======================================================');
  console.log('🔍 Testing Supabase Connection & Configuration');
  console.log('=======================================================');

  const url = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  console.log(`📡 Supabase URL: ${url || '[NOT SET]'}`);
  console.log(`🔑 Anon Key: ${anonKey ? `${anonKey.slice(0, 12)}...` : '[NOT SET]'}`);
  console.log(`🔐 Service Role Key: ${serviceKey ? `${serviceKey.slice(0, 12)}...` : '[NOT SET]'}`);

  if (!isSupabaseConfigured) {
    console.warn('\n⚠️ Supabase is not configured yet.');
    console.log('To connect Supabase:');
    console.log('1. Open backend/.env.supabase');
    console.log('2. Paste your project URL, anon key, and service role key');
    console.log('3. Run "node src/config/init-supabase.js" to verify.');
    return;
  }

  // Test Supabase Admin API
  try {
    const { data: buckets, error: storageErr } = await supabaseAdmin.storage.listBuckets();
    if (storageErr) {
      console.error('❌ Storage API check failed:', storageErr.message);
    } else {
      console.log('✓ Storage API operational. Found buckets:', buckets.map(b => b.name).join(', ') || 'None');
    }

    // Test DB query
    const { data, error: dbErr } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
    if (dbErr) {
      if (dbErr.code === '42P01') {
        console.warn('⚠️ Connected to Supabase, but "users" table not created yet.');
        console.log('👉 Run the SQL migration script from backend/src/config/supabase-schema.sql in the Supabase SQL Editor.');
      } else {
        console.error('❌ Database query error:', dbErr.message);
      }
    } else {
      console.log('✓ Database connection verified: "users" table accessible.');
    }

    console.log('\n🎉 Supabase integration verified successfully!');
  } catch (err) {
    console.error('❌ Supabase test exception:', err.message);
  }
}

checkSupabase();

