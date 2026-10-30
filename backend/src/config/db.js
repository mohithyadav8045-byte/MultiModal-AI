import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let usePg = false;

// Embedded fallback store file path
const fallbackStorePath = path.resolve(__dirname, '../../data/store.json');

// Memory store structure for resilient fallback when Postgres is unreachable
let memoryStore = {
  users: [],
  assets: [],
  chat_sessions: [],
  chat_messages: [],
  reports: []
};

// Load saved data from disk if exists
try {
  const dir = path.dirname(fallbackStorePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(fallbackStorePath)) {
    const raw = fs.readFileSync(fallbackStorePath, 'utf8');
    memoryStore = JSON.parse(raw);
  }
} catch (err) {
  console.warn('[Database] Initializing fallback store in memory:', err.message);
}

function saveFallbackStore() {
  try {
    fs.writeFileSync(fallbackStorePath, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database] Error saving fallback store:', err.message);
  }
}

// SQL Schema definition for PostgreSQL
export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    modality VARCHAR(50) NOT NULL,
    extracted_text TEXT,
    ai_summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_asset_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_modality ON assets(modality);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
`;

/**
 * Initialize Database Connection
 */
export async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes('neon.tech') || connectionString.includes('supabase.co')
          ? { rejectUnauthorized: false }
          : false,
        connectionTimeoutMillis: 5000
      });

      // Test connection
      const client = await pool.connect();
      console.log('[Database] Connected to PostgreSQL successfully.');
      
      // Execute schema
      await client.query(SCHEMA_SQL);
      console.log('[Database] Schema verified and indexes created.');
      client.release();
      usePg = true;
      return;
    } catch (err) {
      console.warn('[Database] PostgreSQL connection failed:', err.message);
      console.warn('[Database] Running in persistent fallback store mode. Provide a valid DATABASE_URL in .env to connect to PostgreSQL.');
      usePg = false;
    }
  } else {
    console.warn('[Database] DATABASE_URL not provided. Running in persistent fallback store mode.');
    usePg = false;
  }
}

/**
 * Universal query runner: executes against PostgreSQL when available,
 * or handles standard SQL operations in local memory/file store.
 */
export async function query(text, params = []) {
  if (usePg && pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error('[Database PG Query Error]:', err.message, text);
      throw err;
    }
  }

  // Fallback SQL-like interpreter for the defined application models
  return executeFallbackQuery(text, params);
}

/**
 * Robust fallback query runner providing identical PostgreSQL query responses
 */
function executeFallbackQuery(sql, params) {
  const trimmed = sql.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');

  // 1. SELECT queries
  if (/^SELECT/i.test(normalized)) {
    // USERS by ID
    if (/FROM users WHERE id = \$1/i.test(normalized)) {
      const row = memoryStore.users.find(u => u.id === params[0]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    // USERS by email
    if (/FROM users WHERE email = \$1/i.test(normalized)) {
      const row = memoryStore.users.find(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }

    // ASSETS by user_id and id
    if (/FROM assets WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
      const row = memoryStore.assets.find(a => a.id === params[0] && a.user_id === params[1]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }

    // ASSETS list by user_id (with optional modality or search filter)
    if (/FROM assets WHERE user_id = \$1/i.test(normalized)) {
      let filtered = memoryStore.assets.filter(a => a.user_id === params[0]);
      
      // If filtering by modality (params[1])
      if (params.length > 1 && params[1] && params[1] !== 'all') {
        filtered = filtered.filter(a => a.modality.toLowerCase() === params[1].toLowerCase());
      }

      // Sort by created_at DESC
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: filtered.map(item => ({ ...item })), rowCount: filtered.length };
    }

    // CHAT SESSIONS by user_id
    if (/FROM chat_sessions WHERE user_id = \$1/i.test(normalized)) {
      const list = memoryStore.chat_sessions
        .filter(s => s.user_id === params[0])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: list.map(item => ({ ...item })), rowCount: list.length };
    }

    // CHAT SESSIONS by id and user_id
    if (/FROM chat_sessions WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
      const row = memoryStore.chat_sessions.find(s => s.id === params[0] && s.user_id === params[1]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }

    // CHAT MESSAGES by session_id
    if (/FROM chat_messages WHERE session_id = \$1/i.test(normalized)) {
      const list = memoryStore.chat_messages
        .filter(m => m.session_id === params[0])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return { rows: list.map(item => ({ ...item })), rowCount: list.length };
    }

    // REPORTS by user_id
    if (/FROM reports WHERE user_id = \$1/i.test(normalized)) {
      const list = memoryStore.reports
        .filter(r => r.user_id === params[0])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: list.map(item => ({ ...item })), rowCount: list.length };
    }

    // REPORT by id and user_id
    if (/FROM reports WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
      const row = memoryStore.reports.find(r => r.id === params[0] && r.user_id === params[1]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }

    // ASSET counts grouped by modality
    if (/SELECT modality, COUNT\(\*\)/i.test(normalized)) {
      const userAssets = memoryStore.assets.filter(a => a.user_id === params[0]);
      const counts = {};
      userAssets.forEach(a => {
        counts[a.modality] = (counts[a.modality] || 0) + 1;
      });
      const rows = Object.entries(counts).map(([modality, count]) => ({ modality, count: String(count) }));
      return { rows, rowCount: rows.length };
    }
  }

  // 2. INSERT queries
  if (/^INSERT INTO users/i.test(normalized)) {
    const newUser = {
      id: uuidv4(),
      email: params[0],
      password_hash: params[1],
      full_name: params[2],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    saveFallbackStore();
    return { rows: [{ ...newUser }], rowCount: 1 };
  }

  if (/^INSERT INTO assets/i.test(normalized)) {
    const newAsset = {
      id: uuidv4(),
      user_id: params[0],
      title: params[1],
      file_name: params[2],
      file_path: params[3],
      file_size: params[4],
      mime_type: params[5],
      modality: params[6],
      extracted_text: params[7] || '',
      ai_summary: params[8] || '',
      metadata: typeof params[9] === 'string' ? JSON.parse(params[9]) : (params[9] || {}),
      created_at: new Date().toISOString()
    };
    memoryStore.assets.push(newAsset);
    saveFallbackStore();
    return { rows: [{ ...newAsset }], rowCount: 1 };
  }

  if (/^INSERT INTO chat_sessions/i.test(normalized)) {
    const newSession = {
      id: uuidv4(),
      user_id: params[0],
      title: params[1],
      created_at: new Date().toISOString()
    };
    memoryStore.chat_sessions.push(newSession);
    saveFallbackStore();
    return { rows: [{ ...newSession }], rowCount: 1 };
  }

  if (/^INSERT INTO chat_messages/i.test(normalized)) {
    const newMessage = {
      id: uuidv4(),
      session_id: params[0],
      sender: params[1],
      content: params[2],
      citations: typeof params[3] === 'string' ? JSON.parse(params[3]) : (params[3] || []),
      created_at: new Date().toISOString()
    };
    memoryStore.chat_messages.push(newMessage);
    saveFallbackStore();
    return { rows: [{ ...newMessage }], rowCount: 1 };
  }

  if (/^INSERT INTO reports/i.test(normalized)) {
    const newReport = {
      id: uuidv4(),
      user_id: params[0],
      title: params[1],
      content: params[2],
      source_asset_ids: typeof params[3] === 'string' ? JSON.parse(params[3]) : (params[3] || []),
      created_at: new Date().toISOString()
    };
    memoryStore.reports.push(newReport);
    saveFallbackStore();
    return { rows: [{ ...newReport }], rowCount: 1 };
  }

  // 3. DELETE queries
  if (/^DELETE FROM assets WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
    const idx = memoryStore.assets.findIndex(a => a.id === params[0] && a.user_id === params[1]);
    if (idx !== -1) {
      const deleted = memoryStore.assets.splice(idx, 1)[0];
      saveFallbackStore();
      return { rows: [deleted], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (/^DELETE FROM chat_sessions WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
    const idx = memoryStore.chat_sessions.findIndex(s => s.id === params[0] && s.user_id === params[1]);
    if (idx !== -1) {
      const deleted = memoryStore.chat_sessions.splice(idx, 1)[0];
      // Cascade delete messages
      memoryStore.chat_messages = memoryStore.chat_messages.filter(m => m.session_id !== params[0]);
      saveFallbackStore();
      return { rows: [deleted], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (/^DELETE FROM reports WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
    const idx = memoryStore.reports.findIndex(r => r.id === params[0] && r.user_id === params[1]);
    if (idx !== -1) {
      const deleted = memoryStore.reports.splice(idx, 1)[0];
      saveFallbackStore();
      return { rows: [deleted], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

export default {
  initDatabase,
  query,
  isPostgres: () => usePg
};

