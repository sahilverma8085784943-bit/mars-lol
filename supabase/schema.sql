-- =====================================================================
-- BIOMETRIC FACE RECOGNITION ATTENDANCE SYSTEM
-- Supabase SQL Schema, Tables, Constraints, Indexes & RLS Policies
-- =====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table (Enrolled Biometric Individuals)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  department TEXT,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'staff', 'admin')) DEFAULT 'student',
  notes TEXT,
  photo_url TEXT,
  face_descriptor JSONB NOT NULL, -- 128-dimensional float array
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Attendance Table (Daily Log with One-Record-Per-Day Constraint)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_at TIMESTAMPTZ,
  confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score >= 0.000 AND confidence_score <= 1.000),
  method TEXT NOT NULL CHECK (method IN ('face', 'manual')) DEFAULT 'face',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_attendance_date UNIQUE (user_id, attendance_date)
);

-- 5. Audit Logs Table (Biometric and System Activity Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal querying speed
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON public.users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Updated_at trigger for users
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role of current authenticated user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles updatable by admins or self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.current_user_role() = 'admin');

-- Users (Enrolled Biometric Individuals) Policies
CREATE POLICY "Users viewable by authenticated staff, viewers, admins"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users insertable only by admins"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Users updatable only by admins"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Users deletable only by admins"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Attendance Policies
CREATE POLICY "Attendance viewable by authenticated users"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance insertable by staff and admins"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Attendance updatable by admins"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Attendance deletable only by admins"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Audit Logs Policies
CREATE POLICY "Audit logs viewable by admins and staff"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Audit logs insertable by system and authenticated staff/admin"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================================
-- STORAGE BUCKET CONFIGURATION (Private Face Profiles)
-- =====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('face-profiles', 'face-profiles', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: read by authenticated users, upload by admin
CREATE POLICY "Face photos accessible by authenticated users"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'face-profiles');

CREATE POLICY "Face photos uploadable by admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'face-profiles' AND public.current_user_role() = 'admin');
