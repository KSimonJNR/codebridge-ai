-- ==============================================================================
-- CodeBridge AI — Supabase Database Migration
-- Version: 20261024000005
-- Tables: public.profiles, public.user_progress
-- Security: Strict Row Level Security (RLS), Column Privileges, Hardened search_path & Revoked Function EXECUTE
-- ==============================================================================

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create normalized user_progress table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_key TEXT NOT NULL,
  progress_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_progress_user_key_unique UNIQUE (user_id, progress_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_key ON public.user_progress(user_id, progress_key);

-- Enable Row Level Security on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. Row Level Security (RLS) Policies
-- Enforces strict user isolation across all allowed operations.
-- Authenticated users can only read and update their own records.
-- ==============================================================================

-- Profiles: SELECT (authenticated users can read only their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Profiles: UPDATE (authenticated users can modify only their own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: Clean up legacy INSERT / DELETE policies if previously created
-- (Profiles are created exclusively by the system trigger and deleted on user cascade)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- User Progress: SELECT
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User Progress: INSERT
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Progress: UPDATE
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Progress: DELETE
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;
CREATE POLICY "Users can delete own progress"
  ON public.user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. Clean up any obsolete triggers & functions
-- ==============================================================================

DROP TRIGGER IF EXISTS tr_protect_profile_email ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_email();

-- ==============================================================================
-- 5. Role Grants & Column-Level Privilege Separation
-- Restricts client privileges to the minimum required:
-- - Profiles: Authenticated users can SELECT, and UPDATE ONLY full_name & avatar_url.
--   No INSERT, DELETE, or UPDATE on id / email is granted to clients.
-- - User Progress: anon is explicitly revoked; authenticated users can perform CRUD.
-- ==============================================================================

-- Revoke all table-level access from clients on profiles
REVOKE ALL ON public.profiles FROM authenticated, anon;

-- Grant SELECT on profiles to authenticated users
GRANT SELECT ON public.profiles TO authenticated;

-- Column-level UPDATE privilege on full_name and avatar_url only
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

-- Explicitly revoke all table-level access from anon on user_progress
REVOKE ALL ON public.user_progress FROM anon;

-- Grant full CRUD on user_progress to authenticated users (governed by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;

-- ==============================================================================
-- 6. Automatic Profile Creation Trigger on auth.users
-- Fired upon new user creation.
-- Hardened with empty search_path (SET search_path = '') and fully qualified objects.
-- COALESCE is used as the standard SQL expression construct.
-- Timestamps use pg_catalog.now() directly for TIMESTAMPTZ columns.
-- ON CONFLICT (id) DO NOTHING ensures existing profile data is never overwritten.
-- Direct execution by client roles is explicitly revoked for security.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Revoke direct execution privileges from client roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. Email Synchronization Trigger on auth.users
-- Keeps public.profiles.email synchronized when a user updates their email in auth.
-- Hardened with empty search_path (SET search_path = '') and fully qualified objects.
-- Timestamps use pg_catalog.now() directly for TIMESTAMPTZ columns.
-- Direct execution by client roles is explicitly revoked for security.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = pg_catalog.now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Revoke direct execution privileges from client roles
REVOKE EXECUTE ON FUNCTION public.handle_user_email_sync() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_sync();

-- ==============================================================================
-- 8. Updated At Triggers
-- Regular trigger function with fixed empty search path and fully qualified objects.
-- Timestamps use pg_catalog.now() directly for TIMESTAMPTZ columns.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER set_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. Idempotent Backfill for Existing auth.users
-- Preserves existing profile values (ON CONFLICT DO NOTHING) while ensuring any
-- existing auth users created prior to running this migration receive a profile row.
-- ==============================================================================

INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  created_at,
  COALESCE(updated_at, created_at)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Table comments
COMMENT ON TABLE public.profiles IS 'Stores user profile metadata. Created and updated via auth triggers; users may only edit full_name and avatar_url.';
COMMENT ON TABLE public.user_progress IS 'Stores normalized user-owned progress data across CodeBridge AI features with RLS.';
