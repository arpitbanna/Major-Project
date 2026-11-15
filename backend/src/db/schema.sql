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
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own non-role fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role or Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
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


-- ============================================================================
-- SHIFT HANDOVER MODULE (Phase 5)
-- ============================================================================

-- 4. Create Shift Handovers Table
CREATE TABLE IF NOT EXISTS public.shift_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mine_section TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('Shift 1 (Morning)', 'Shift 2 (Afternoon)', 'Shift 3 (Night)')),
  outgoing_incharge_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  incoming_incharge_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  production_summary TEXT,
  equipment_status TEXT,
  safety_observations TEXT,
  pending_work TEXT,
  remarks TEXT,
  
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Acknowledged')),
  
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for Performance & Search Queries
CREATE INDEX IF NOT EXISTS idx_shift_handovers_date ON public.shift_handovers(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_status ON public.shift_handovers(status);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_section ON public.shift_handovers(mine_section);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_outgoing ON public.shift_handovers(outgoing_incharge_id);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_incoming ON public.shift_handovers(incoming_incharge_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view shift handovers
DROP POLICY IF EXISTS "Authenticated users can view shift handovers" ON public.shift_handovers;
CREATE POLICY "Authenticated users can view shift handovers"
  ON public.shift_handovers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Authorized mining personnel can create shift handovers
DROP POLICY IF EXISTS "Authorized staff can insert handovers" ON public.shift_handovers;
CREATE POLICY "Authorized staff can insert handovers"
  ON public.shift_handovers
  FOR INSERT
  WITH CHECK (
    auth.uid() = outgoing_incharge_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor')
    )
  );

-- Policy: Outgoing in-charge can update their own draft handovers
DROP POLICY IF EXISTS "Creator can update draft handovers" ON public.shift_handovers;
CREATE POLICY "Creator can update draft handovers"
  ON public.shift_handovers
  FOR UPDATE
  USING (
    auth.uid() = outgoing_incharge_id AND status = 'Draft'
  )
  WITH CHECK (
    auth.uid() = outgoing_incharge_id AND status IN ('Draft', 'Submitted')
  );

-- Policy: Incoming in-charge or Admin/Manager can acknowledge submitted handovers
DROP POLICY IF EXISTS "Incoming incharge can acknowledge submitted handovers" ON public.shift_handovers;
CREATE POLICY "Incoming incharge can acknowledge submitted handovers"
  ON public.shift_handovers
  FOR UPDATE
  USING (
    status = 'Submitted' AND (
      auth.uid() = incoming_incharge_id OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge')
      )
    )
  )
  WITH CHECK (
    status = 'Acknowledged'
  );

-- 7. Trigger to Enforce Immutability Once Acknowledged
CREATE OR REPLACE FUNCTION public.prevent_acknowledged_handover_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'Acknowledged' THEN
    RAISE EXCEPTION 'Statutory record locked: Acknowledged shift handovers cannot be modified.';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_acknowledged_handover_update ON public.shift_handovers;
CREATE TRIGGER trg_prevent_acknowledged_handover_update
  BEFORE UPDATE ON public.shift_handovers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_acknowledged_handover_update();


-- ============================================================================
-- SAFETY MANAGEMENT PLAN (SMP) & HAZARDS MODULE (Phase 6)
-- Conforms to standard mining risk assessment methodology (DGMS SMP guidelines)
-- ============================================================================

-- 8. Create Hazards Table
CREATE TABLE IF NOT EXISTS public.hazards_smp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mine_section TEXT NOT NULL,
  hazard_category TEXT NOT NULL CHECK (
    hazard_category IN (
      'Strata Control',
      'Ventilation & Mine Gases',
      'Inundation & Water',
      'Haulage & Transport',
      'Machinery & Electrical',
      'Fire & Spontaneous Combustion',
      'Dust & Airborne Hazards',
      'General / Other'
    )
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_details TEXT,
  reported_by_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  
  -- 5x5 Risk Assessment Matrix
  likelihood INT NOT NULL DEFAULT 1 CHECK (likelihood >= 1 AND likelihood <= 5),
  severity INT NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  risk_score INT NOT NULL DEFAULT 1 CHECK (risk_score >= 1 AND risk_score <= 25),
  risk_level TEXT NOT NULL DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High', 'Extreme')),
  
  status TEXT NOT NULL DEFAULT 'Open' CHECK (
    status IN ('Open', 'Under Review', 'Action Assigned', 'Action Completed', 'Closed')
  ),
  initial_assessment_notes TEXT,
  
  -- Manager Verification & Closeout
  verified_by_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Safety Corrective Actions Table
CREATE TABLE IF NOT EXISTS public.safety_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_id UUID NOT NULL REFERENCES public.hazards_smp(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'Engineering Control' CHECK (
    action_type IN ('Elimination', 'Substitution', 'Engineering Control', 'Administrative Control', 'PPE')
  ),
  assigned_to_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'In Progress', 'Completed')
  ),
  completed_at TIMESTAMPTZ,
  completion_remarks TEXT,
  created_by_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_hazards_status ON public.hazards_smp(status);
CREATE INDEX IF NOT EXISTS idx_hazards_risk_level ON public.hazards_smp(risk_level);
CREATE INDEX IF NOT EXISTS idx_hazards_section ON public.hazards_smp(mine_section);
CREATE INDEX IF NOT EXISTS idx_hazards_reported_by ON public.hazards_smp(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_safety_actions_hazard ON public.safety_actions(hazard_id);
CREATE INDEX IF NOT EXISTS idx_safety_actions_assigned ON public.safety_actions(assigned_to_id);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.hazards_smp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_actions ENABLE ROW LEVEL SECURITY;

-- 11a. Hazards Policies
DROP POLICY IF EXISTS "Authenticated users can view hazards" ON public.hazards_smp;
CREATE POLICY "Authenticated users can view hazards"
  ON public.hazards_smp
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authorized mining staff can report hazards" ON public.hazards_smp;
CREATE POLICY "Authorized mining staff can report hazards"
  ON public.hazards_smp
  FOR INSERT
  WITH CHECK (
    auth.uid() = reported_by_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor')
    )
  );

DROP POLICY IF EXISTS "Supervisors and Managers can update hazards" ON public.hazards_smp;
CREATE POLICY "Supervisors and Managers can update hazards"
  ON public.hazards_smp
  FOR UPDATE
  USING (
    status != 'Closed' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor')
    )
  );

-- 11b. Safety Actions Policies
DROP POLICY IF EXISTS "Authenticated users can view safety actions" ON public.safety_actions;
CREATE POLICY "Authenticated users can view safety actions"
  ON public.safety_actions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Supervisors and Managers can insert safety actions" ON public.safety_actions;
CREATE POLICY "Supervisors and Managers can insert safety actions"
  ON public.safety_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge')
    )
  );

DROP POLICY IF EXISTS "Assignee or Manager can update action status" ON public.safety_actions;
CREATE POLICY "Assignee or Manager can update action status"
  ON public.safety_actions
  FOR UPDATE
  USING (
    auth.uid() = assigned_to_id OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Mine Manager', 'Shift In-charge')
    )
  );

-- 12. Immutability Trigger on Closed Hazards
CREATE OR REPLACE FUNCTION public.prevent_closed_hazard_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'Closed' THEN
    RAISE EXCEPTION 'Audit record locked: Closed hazard logs cannot be modified.';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_closed_hazard_update ON public.hazards_smp;
CREATE TRIGGER trg_prevent_closed_hazard_update
  BEFORE UPDATE ON public.hazards_smp
  FOR EACH ROW EXECUTE FUNCTION public.prevent_closed_hazard_update();
