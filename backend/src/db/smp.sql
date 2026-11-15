-- ============================================================================
-- COAL MINE PRODUCTIVITY & SAFETY MANAGEMENT SYSTEM
-- Safety Management Plan (SMP) & Hazard Management Schema (Phase 6)
-- Conforms to standard mining risk assessment methodology (DGMS SMP guidelines)
-- ============================================================================

-- 1. Create Hazards Table
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

-- 2. Create Safety Corrective Actions Table
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

-- 3. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_hazards_status ON public.hazards_smp(status);
CREATE INDEX IF NOT EXISTS idx_hazards_risk_level ON public.hazards_smp(risk_level);
CREATE INDEX IF NOT EXISTS idx_hazards_section ON public.hazards_smp(mine_section);
CREATE INDEX IF NOT EXISTS idx_hazards_reported_by ON public.hazards_smp(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_safety_actions_hazard ON public.safety_actions(hazard_id);
CREATE INDEX IF NOT EXISTS idx_safety_actions_assigned ON public.safety_actions(assigned_to_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.hazards_smp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_actions ENABLE ROW LEVEL SECURITY;

-- 4a. Hazards Policies
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

-- 4b. Safety Actions Policies
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

-- 5. Immutability Trigger on Closed Hazards
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
