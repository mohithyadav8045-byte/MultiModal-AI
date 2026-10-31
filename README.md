# OmniMind AI (OmniDoc AI)
### Clean 3-Tier Enterprise Multimodal Architecture: Frontend • Backend • Database

![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Clean-0c8fe9?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-Vercel%20%7C%20React%2018%20%7C%20Tailwind-000000?style=for-the-badge&logo=vercel)
![Backend](https://img.shields.io/badge/Backend-Render%20%7C%20Node.js%20%7C%20Express-46E3B7?style=for-the-badge&logo=render)
![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)

---

## 1. Project Directory Structure

The project has been organized into **exactly 3 separate, clean directories**:

```text
MultiModal--AI/
│
├── frontend/               ── 1. FRONTEND SYSTEM (Deploy to Vercel)
│   ├── .env                ── Local development & Vercel env
│   ├── .env.example        ── Template for Vercel Project Settings
│   ├── vercel.json         ── Vercel SPA routing rewrites & security headers
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/     ── Navbar, Sidebar, FileUploadZone, AssetCard, ChatInterface, ReportBuilder
│       ├── pages/          ── Landing, Login, Register, Dashboard, Upload, Workspace, Chat, Reports
│       ├── context/        ── AuthContext (JWT & Supabase session)
│       └── services/
│           ├── api.js      ── Axios client (points to Render backend)
│           └── supabase.js ── Supabase client (@supabase/supabase-js)
│
├── backend/                ── 2. BACKEND SYSTEM (Deploy to Render)
│   ├── .env                ── Server, Supabase, Gemini & JWT secrets
│   ├── .env.example        ── Template for Render Environment Variables
│   ├── render.yaml         ── Render Blueprint deployment configuration
│   ├── package.json
│   ├── uploads/            ── Local fallback storage
│   └── src/
│       ├── server.js       ── Express API server (/api/health, /api/supabase/status)
│       ├── config/
│       │   ├── db.js       ── PostgreSQL pool & query runner
│       │   └── supabase.js ── Supabase admin & anon client SDK
│       ├── controllers/    ── auth, asset, chat, report controllers
│       ├── middleware/     ── auth, upload (50MB Multer), zod validation
│       ├── routes/         ── auth, asset, chat, report routes
│       └── services/
│           ├── gemini.service.js           ── Google Gemini 2.5 Flash & Pro multimodal engine
│           └── supabase-storage.service.js ── Supabase Storage bucket ('multimodal-assets')
│
└── database/               ── 3. DATABASE SYSTEM (Supabase / PostgreSQL)
    ├── schema.sql          ── Production SQL schema (tables, RLS policies, storage bucket)
    ├── init-supabase.js    ── Automated connection diagnostic & test script
    ├── .env.example        ── Supabase connection variables template
    └── README.md           ── Step-by-step Supabase SQL Editor guide
```

---

## 2. Deployment Guide: Render & Vercel

### A. Deploy Backend to Render

1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check Path:** `/api/health`
4. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://[project-id].supabase.co
   SUPABASE_ANON_KEY=[your-supabase-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]
   SUPABASE_STORAGE_BUCKET=multimodal-assets
   GEMINI_API_KEY=[your-google-gemini-api-key]
   JWT_SECRET=[generate-or-paste-any-secret-string]
   CORS_ORIGIN=https://[your-vercel-app-name].vercel.app
   ```
5. Click **Create Web Service**. Once deployed, copy your Render URL (e.g. `https://omnimind-backend.onrender.com`).

---

### B. Deploy Frontend to Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New…** → **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Vite` *(automatically detected)*
   - **Root Directory:** Click **Edit** and choose `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Start Command:** *(None needed — Vercel serves static/SPA via CDN)*
4. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://[your-render-service].onrender.com/api
   VITE_SUPABASE_URL=https://[your-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[your-supabase-anon-key]
   ```
5. Click **Deploy**. Vercel will build and host your app with SPA client-side routing.

---

### C. Initialize Supabase Database

1. In your [Supabase Dashboard](https://supabase.com/dashboard), open the **SQL Editor**.
2. Copy and paste the entire contents of `database/schema.sql`.
3. Click **Run**.
   - This creates all tables (`users`, `assets`, `chat_sessions`, `chat_messages`, `reports`).
   - Configures Row Level Security (RLS) policies.
   - Creates the `multimodal-assets` storage bucket.
4. Test connectivity from your machine:
   ```bash
   npm run database:check
   ```

---

## 3. Local Development Commands

| Command | Action |
| :--- | :--- |
| `npm run frontend:dev` | Start React frontend on `http://localhost:5173` |
| `npm run frontend:build` | Build production frontend bundle |
| `npm run backend:dev` | Start Express backend on `http://localhost:5000` |
| `npm run database:check` | Run Supabase connection & storage diagnostic |
| `npm run setup` | Install dependencies for both backend and frontend |
