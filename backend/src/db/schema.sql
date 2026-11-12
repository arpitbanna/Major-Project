-- ============================================================================
-- COAL MINE PRODUCTIVITY & SAFETY MANAGEMENT SYSTEM
-- Database Schema for User Roles & Profiles (Phase 3)
-- ============================================================================

-- 1. Create User Profiles Table
-- Linked directly to Supabase Auth's built-in auth.users table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor')),
  designation TEXT DEFAULT 'Mine Staff',
  mine_section TEXT DEFAULT 'Main Section',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own non-role fields
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role or Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 3. Automatic Profile Creation Trigger
-- When a user is created via Supabase Auth, populate user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, designation, mine_section)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Supervisor'),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Overman / Sirdar'),
    COALESCE(NEW.raw_user_meta_data->>'mine_section', 'Section A')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
