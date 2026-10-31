# OmniMind AI — Database Configuration (Supabase & PostgreSQL)

This directory contains the production database migrations, schema definitions, and connection diagnostics for OmniMind AI.

---

## Quick Setup in 3 Steps

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL**
   - **anon key** (public)
   - **service_role key** (secret)
3. Under **Project Settings -> Database**, copy the **Connection string** (URI under Connection Pooling, port 6543).

### Step 2: Run the Schema
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** on the left menu.
3. Open `database/schema.sql` from this folder, copy its entire contents, and paste them into the SQL Editor.
4. Click **Run**.
   - This creates all tables: `users`, `assets`, `chat_sessions`, `chat_messages`, `reports`.
   - Enables Row Level Security (RLS).
   - Configures the `multimodal-assets` storage bucket.

### Step 3: Test Connectivity
Run the diagnostic script from the project root:
```bash
node database/init-supabase.js
```

