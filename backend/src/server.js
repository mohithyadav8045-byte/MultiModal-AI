import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from backend directory or cwd
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import db from './config/db.js';
import { isSupabaseConfigured, supabaseAdmin } from './config/supabase.js';
import authRoutes from './routes/auth.routes.js';
import assetRoutes from './routes/asset.routes.js';
import chatRoutes from './routes/chat.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS Configuration (supports Vercel and local dev origins)
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === allowedOrigin ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for fallback local uploads
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Health check endpoint (for Render / Vercel ping)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'OmniMind AI Backend & Render Service',
    database: db.isPostgres() ? 'PostgreSQL / Supabase' : 'Embedded Storage',
    supabase: {
      configured: isSupabaseConfigured,
      url: process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL || null,
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'multimodal-assets',
      hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
    },
    geminiStatus: process.env.GEMINI_API_KEY ? 'Configured' : 'Simulation Mode'
  });
});

// Dedicated Supabase status & verification endpoint
app.get('/api/supabase/status', async (req, res) => {
  try {
    let storageBuckets = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.storage.listBuckets();
      if (!error && data) storageBuckets = data.map(b => b.name);
    }

    res.status(200).json({
      success: true,
      configured: isSupabaseConfigured,
      projectUrl: process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL || 'Not Set',
      hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'multimodal-assets',
      activeBuckets: storageBuckets,
      renderDeployment: Boolean(process.env.RENDER)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 50MB limit.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

// Start Server and Initialize Database
async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 OmniMind Backend running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Supabase Configured: ${isSupabaseConfigured ? 'YES' : 'PENDING'}`);
      console.log(`=======================================================`);
    });
  } catch (startupErr) {
    console.error('Failed to start server:', startupErr);
    process.exit(1);
  }
}

startServer();
