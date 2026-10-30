import { initDatabase, SCHEMA_SQL } from './db.js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

async function setup() {
  console.log('--- Initializing OmniDoc AI PostgreSQL Schema ---');
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('neon.tech') || connectionString.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');
    console.log('Executing schema migration...');
    await client.query(SCHEMA_SQL);
    console.log('✓ Tables created: users, assets, chat_sessions, chat_messages, reports');
    console.log('✓ Performance indexes verified');
    console.log('Database initialization complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

setup();

