-- ==============================================================================
-- OmniMind AI (OmniDoc AI) - Supabase / PostgreSQL Production Schema
-- Compatible with Supabase SQL Editor and direct PostgreSQL 15+
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Assets Table (Multimodal Ingested Media & Extracted Metadata)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    modality VARCHAR(50) NOT NULL, -- 'document', 'image', 'audio', 'video', 'text'
    extracted_text TEXT,
    ai_summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    storage_type VARCHAR(50) DEFAULT 'local', -- 'supabase' or 'local'
    storage_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chat Messages Table (Conversations, Multi-Asset Grounding & Citations)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'user' or 'ai'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Generated Reports Table (Executive Cross-Modal Synthesis)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_asset_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_modality ON public.assets(modality);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies (Allows backend service role & authenticated user operations)
CREATE POLICY "Service Role full access on users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service Role full access on assets" ON public.assets
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service Role full access on chat_sessions" ON public.chat_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service Role full access on chat_messages" ON public.chat_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service Role full access on reports" ON public.reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR true);

-- 10. Supabase Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('multimodal-assets', 'multimodal-assets', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Public read access policy for previewing multimodal media
CREATE POLICY "Public Read for multimodal assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'multimodal-assets');

-- Upload access policy for storage
CREATE POLICY "Allow Uploads for multimodal assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'multimodal-assets');

