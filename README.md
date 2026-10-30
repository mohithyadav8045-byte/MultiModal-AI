# OmniMind AI (OmniDoc AI)
### 3-Tier Enterprise Multimodal Architecture: Client (Vercel) • Server (Render) • Backend (Supabase)

![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Distributed-0c8fe9?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%7C%20Storage%20%7C%20RLS-3ECF8E?style=for-the-badge&logo=supabase)
![Render](https://img.shields.io/badge/Render-Backend%20Web%20Service-46E3B7?style=for-the-badge&logo=render)
![Vercel](https://img.shields.io/badge/Vercel-Client%20Deployment-000000?style=for-the-badge&logo=vercel)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20%26%20Pro-4285F4?style=for-the-badge&logo=google)

---

## 1. System Topology Overview

The workspace is organized into **three distinct, modular systems**:

```mermaid
graph LR
    subgraph Client ["1. Client (Vercel)"]
        UI["React 18 + Vite SPA"]
        VercelConfig["vercel.json Routing"]
        ClientSB["@supabase/supabase-js (Anon Key)"]
    end

    subgraph Server ["2. Server (Render)"]
        Express["Express.js API Gateway"]
        AuthMiddleware["JWT + Bcrypt Auth"]
        RenderConfig["render.yaml Blueprint"]
        GeminiService["Google Gemini 2.5 Flash / Pro"]
    end

    subgraph Backend ["3. Backend (Supabase)"]
        PG["Supabase PostgreSQL (Port 6543/5432)"]
        Storage["Supabase Storage ('multimodal-assets')"]
        RLS["Row Level Security Policies"]
        AdminSB["Supabase Service Role Key"]
    end

    Client -->|REST API / Bearer JWT| Server
    Client -.->|Direct Public Previews| Storage
    Server -->|Admin Client / Service Key| Storage
    Server -->|SQL Connection Pool| PG
    Server -->|Base64 Media & Prompts| GeminiService
```

1. **`client/` (Frontend - Vercel Ready):**
   - Single-Page React 18 Application with Vite and Tailwind CSS.
   - Configured specifically for **Vercel** with `client/vercel.json` for SPA rewrites and security headers.
   - Initialized with `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

2. **`server/` (API Server - Render Ready):**
   - Express.js REST API with route controllers, Zod validation, and Multer file upload pipelines.
   - Configured for **Render** via `server/render.yaml` with automated health checks (`/api/health`) and `/api/supabase/status`.

3. **`backend/` (Database & Storage Engine - Supabase Connected):**
   - Contains direct PostgreSQL connection pool (`pg`) for high-performance direct SQL.
   - Includes production Supabase schema (`backend/src/config/supabase-schema.sql`) with tables, UUID generator, and RLS policies.
   - Provides Supabase Storage service (`backend/src/services/supabase-storage.service.js`) for automatic upload and signed URL streaming to the `multimodal-assets` bucket.
   - Includes verification script: `node backend/src/config/init-supabase.js`.

---

## 2. Dedicated Environment Configuration

Each tier has dedicated environment files and dedicated Supabase configuration files:

### Client Configuration (`client/.env` and `client/.env.supabase`)
```env
# Backend API Base (Local or Render)
VITE_API_BASE_URL=http://localhost:5000/api

# Supabase Project Credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_SERVICE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_STORAGE_BUCKET=multimodal-assets
```

### Backend & Server Configuration (`backend/.env.supabase` / `server/.env.supabase`)
```env
# Supabase Project URL
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (Public)
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role Key (Secret Service Key - keeps backend authorized to manage storage)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Supabase PostgreSQL Database Connection URL (Transaction Pooler or Direct)
DATABASE_URL=postgresql://postgres.your-project-id:your-db-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase Storage Bucket
SUPABASE_STORAGE_BUCKET=multimodal-assets
```

---

## 3. How to Connect Supabase in 3 Simple Steps

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Go to **Project Settings -> API** and copy:
   - **Project URL**
   - **Project API Keys:** `anon` (public) and `service_role` (secret)
3. Go to **Project Settings -> Database** and copy the **Connection String** (choose URI with connection pooling or direct).

### Step 2: Paste Credentials into `.env.supabase`
Open [backend/.env.supabase](file:///c:/Users/dines/Downloads/MultiModal--AI/backend/.env.supabase) and [client/.env.supabase](file:///c:/Users/dines/Downloads/MultiModal--AI/client/.env.supabase) and paste your credentials:
```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres.<project-id>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

### Step 3: Run the Schema in Supabase SQL Editor
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the contents of [backend/src/config/supabase-schema.sql](file:///c:/Users/dines/Downloads/MultiModal--AI/backend/src/config/supabase-schema.sql).
3. Click **Run**. This will create the `users`, `assets`, `chat_sessions`, `chat_messages`, `reports` tables, configure RLS policies, and initialize the `multimodal-assets` storage bucket.
4. Verify from the terminal:
   ```bash
   npm run supabase:check
   ```

---

## 4. Deployment Guides

### Deploying the Backend on Render
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New -> Web Service** and select your repository (Root Directory: `backend` or `server`).
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `node src/server.js`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase pooler URL
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<your-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-service-key>`
   - `GEMINI_API_KEY`: `<your-gemini-key>`
   - `JWT_SECRET`: `<your-jwt-secret>`
   - `CORS_ORIGIN`: Your Vercel frontend URL (e.g. `https://omnimind-client.vercel.app`)

### Deploying the Client on Vercel
1. In the [Vercel Dashboard](https://vercel.com/), click **Add New -> Project** and select your repository.
2. Set **Root Directory:** `client` (or `frontend`).
3. Framework Preset: **Vite** (auto-detected).
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-anon-key>`
5. Click **Deploy**. Vercel will build the SPA using [client/vercel.json](file:///c:/Users/dines/Downloads/MultiModal--AI/client/vercel.json) without any routing issues.

---

## 5. Local Development Commands

| Command | Action |
| :--- | :--- |
| `npm run client:dev` | Launch React client on `http://localhost:5173` |
| `npm run client:build` | Build production client for Vercel |
| `npm run backend:dev` | Launch backend with Supabase connector on `http://localhost:5000` |
| `npm run server:dev` | Launch standalone API server on `http://localhost:5000` |
| `npm run supabase:check` | Verify live Supabase database & storage connectivity |
