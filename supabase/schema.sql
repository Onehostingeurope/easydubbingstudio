-- Easy Dubbing Supabase PostgreSQL Database Schema
-- Includes tables, indexes, triggers, and RLS policies

-- 1. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    monthly_price numeric NOT NULL,
    credits_per_month integer NOT NULL,
    max_video_size_mb integer NOT NULL,
    max_languages_per_project integer NOT NULL DEFAULT 5,
    allow_precision_mode boolean NOT NULL DEFAULT true,
    allow_proofread boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROFILES TABLE (Linked with Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan text NOT NULL DEFAULT 'starter',
    credits_balance integer NOT NULL DEFAULT 30,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    source_type text NOT NULL CHECK (source_type IN ('upload', 'url', 'asset_id')),
    source_video_url text,
    source_asset_id text,
    source_language text DEFAULT 'auto-detect',
    mode text NOT NULL DEFAULT 'speed' CHECK (mode IN ('speed', 'precision')),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'running', 'completed', 'failed', 'partial')),
    enable_caption boolean NOT NULL DEFAULT true,
    translate_audio_only boolean NOT NULL DEFAULT false,
    enable_speech_enhancement boolean NOT NULL DEFAULT false,
    disable_music_track boolean NOT NULL DEFAULT false,
    enable_dynamic_duration boolean NOT NULL DEFAULT true,
    proofread_enabled boolean NOT NULL DEFAULT false,
    credits_used integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PROJECT_TRANSLATIONS TABLE
CREATE TABLE IF NOT EXISTS public.project_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    heygen_video_translation_id text UNIQUE NOT NULL,
    language text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    video_url text,
    thumbnail_url text,
    caption_srt_url text,
    caption_vtt_url text,
    duration numeric,
    failure_code text,
    failure_message text,
    callback_payload jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. USAGE_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    action text NOT NULL,
    credits_used integer NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. WEBHOOK_EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text UNIQUE NOT NULL,
    event_type text NOT NULL,
    heygen_video_translation_id text,
    raw_payload jsonb NOT NULL,
    processed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_project_id ON public.project_translations(project_id);
CREATE INDEX IF NOT EXISTS idx_translations_user_id ON public.project_translations(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_heygen_id ON public.project_translations(heygen_video_translation_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_translation_id ON public.webhook_events(heygen_video_translation_id);

-- 8. AUTO-TIMESTAMP UPDATE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER trigger_update_projects_timestamp BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER trigger_update_translations_timestamp BEFORE UPDATE ON public.project_translations FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- 9. AUTO-CREATE PROFILE ON SIGN UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, plan, credits_balance)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user',
        'starter',
        30 -- Starter Plan Credits limit
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if a user is an admin without recursion (runs as SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Plans Policies: Anyone can view
CREATE POLICY "Allow public read access to plans" ON public.plans
    FOR SELECT USING (true);

-- Profiles Policies: Users can view & update their own profile; Admins can do anything
CREATE POLICY "Allow users to view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admin full access to profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Projects Policies: Users can view, create, and update their own projects; Admins can do anything
CREATE POLICY "Allow users to view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to projects" ON public.projects
    FOR ALL USING (public.is_admin());

-- Translations Policies: Owner can view/create/edit
CREATE POLICY "Allow users to view own translations" ON public.project_translations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own translations" ON public.project_translations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own translations" ON public.project_translations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to translations" ON public.project_translations
    FOR ALL USING (public.is_admin());

-- Usage Logs Policies: Owner can view
CREATE POLICY "Allow users to view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to usage logs" ON public.usage_logs
    FOR ALL USING (public.is_admin());

-- Webhook Events Policies: Admin only can read/write
CREATE POLICY "Allow admin full access to webhooks" ON public.webhook_events
    FOR ALL USING (public.is_admin());

-- 11. SEED DEFAULT PLANS DATA
INSERT INTO public.plans (name, monthly_price, credits_per_month, max_video_size_mb, max_languages_per_project, allow_precision_mode, allow_proofread)
VALUES
    ('starter', 29, 30, 200, 3, false, false),
    ('creator', 79, 150, 1024, 10, true, true),
    ('agency', 199, 500, 2048, 20, true, true)
ON CONFLICT (name) DO NOTHING;
