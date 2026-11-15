-- ============================================================================
-- COAL MINE PRODUCTIVITY & SAFETY MANAGEMENT SYSTEM (CoalSafe)
-- Master Relational Database Seed Script
-- Idempotent, safe to rerun, respects all RLS policies and table constraints.
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_manager_id UUID;
  v_incharge_id UUID;
  v_supervisor_id UUID;
  v_h1_id UUID;
  v_h2_id UUID;
  v_h3_id UUID;
  v_h4_id UUID;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN

  -- --------------------------------------------------------------------------
  -- 1. Ensure Demo Accounts Exist in auth.users
  -- Uses standard Supabase pgcrypto password hashing (Password: CoalSafe@2026)
  -- --------------------------------------------------------------------------
  
  -- Admin: admin@colliery.in
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@colliery.in';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@colliery.in',
      extensions.crypt('CoalSafe@2026', extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Chief Administrator","role":"Admin","designation":"System & Safety Administrator","mine_section":"Central Operations"}',
      NOW(), NOW()
    );
  END IF;

  -- Mine Manager: manager@colliery.in
  SELECT id INTO v_manager_id FROM auth.users WHERE email = 'manager@colliery.in';
  IF v_manager_id IS NULL THEN
    v_manager_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'manager@colliery.in',
      extensions.crypt('CoalSafe@2026', extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Er. Rajesh Sharma","role":"Mine Manager","designation":"First Class Mine Manager","mine_section":"Colliery Sec-1"}',
      NOW(), NOW()
    );
  END IF;

  -- Shift In-charge: incharge@colliery.in
  SELECT id INTO v_incharge_id FROM auth.users WHERE email = 'incharge@colliery.in';
  IF v_incharge_id IS NULL THEN
    v_incharge_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_incharge_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'incharge@colliery.in',
      extensions.crypt('CoalSafe@2026', extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Amit Kumar Verma","role":"Shift In-charge","designation":"Overman Shift In-charge","mine_section":"Panel A - Longwall"}',
      NOW(), NOW()
    );
  END IF;

  -- Supervisor: supervisor@colliery.in
  SELECT id INTO v_supervisor_id FROM auth.users WHERE email = 'supervisor@colliery.in';
  IF v_supervisor_id IS NULL THEN
    v_supervisor_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_supervisor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'supervisor@colliery.in',
      extensions.crypt('CoalSafe@2026', extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Suresh Singh","role":"Supervisor","designation":"Mining Sirdar / Strata Inspector","mine_section":"Panel A - Longwall"}',
      NOW(), NOW()
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- 2. Populate public.user_profiles with Trusted Statutory Roles
  -- --------------------------------------------------------------------------
  INSERT INTO public.user_profiles (id, full_name, role, designation, mine_section, is_active)
  VALUES
    (v_admin_id, 'Chief Administrator', 'Admin', 'System & Safety Administrator', 'Central Operations', true),
    (v_manager_id, 'Er. Rajesh Sharma', 'Mine Manager', 'First Class Mine Manager', 'Colliery Sec-1', true),
    (v_incharge_id, 'Amit Kumar Verma', 'Shift In-charge', 'Overman Shift In-charge', 'Panel A - Longwall', true),
    (v_supervisor_id, 'Suresh Singh', 'Supervisor', 'Mining Sirdar / Strata Inspector', 'Panel A - Longwall', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    mine_section = EXCLUDED.mine_section,
    is_active = EXCLUDED.is_active;

  -- --------------------------------------------------------------------------
  -- 3. Seed Shift Handover Records (Phase 5)
  -- --------------------------------------------------------------------------
  
  -- Handover 1: Morning Shift (Acknowledged & Locked)
  IF NOT EXISTS (
    SELECT 1 FROM public.shift_handovers 
    WHERE shift_date = v_today AND shift_type = 'Shift 1 (Morning)'
  ) THEN
    INSERT INTO public.shift_handovers (
      shift_date, shift_type, mine_section,
      outgoing_incharge_id, incoming_incharge_id,
      production_summary, equipment_status, safety_observations, pending_work, remarks,
      status, submitted_at, acknowledged_at, acknowledged_by_id
    ) VALUES (
      v_today, 'Shift 1 (Morning)', 'Panel A - Longwall Face',
      v_incharge_id, v_manager_id,
      '850 Tonnes coal extracted. Continuous miner CM-01 operated for 6.5 hours along shear face. Conveyor discharge rate steady at 140 TPH.',
      'CM-01 cutting picks inspected at mid-shift; 4 picks replaced. AFC chain tension within statutory limits. Feeder breaker FB-02 operational without trip.',
      'Gas monitoring: CH4 at 0.15% (permissible <0.5%), CO at 2 ppm. Airflow velocity measured at 1.8 m/s at face return. Roof strata sound with zero spalling.',
      'Inspect auxiliary ventilation duct coupling at crosscut 4. Lubricate conveyor drive head pulleys.',
      'Maintain water spraying pressure on cutting drums above 12 bar to suppress respirable airborne dust.',
      'Acknowledged', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5.5 hours', v_manager_id
    );
  END IF;

  -- Handover 2: Afternoon Shift (Submitted, Awaiting Next Shift Sign-off)
  IF NOT EXISTS (
    SELECT 1 FROM public.shift_handovers 
    WHERE shift_date = v_today AND shift_type = 'Shift 2 (Afternoon)'
  ) THEN
    INSERT INTO public.shift_handovers (
      shift_date, shift_type, mine_section,
      outgoing_incharge_id, incoming_incharge_id,
      production_summary, equipment_status, safety_observations, pending_work, remarks,
      status, submitted_at
    ) VALUES (
      v_today, 'Shift 2 (Afternoon)', 'Panel A - Longwall Face',
      v_incharge_id, v_manager_id,
      '720 Tonnes coal dispatched. Operational halt for 45 mins due to shuttle car hydraulic hose replacement.',
      'Shuttle Car SC-03 hydraulic hose replaced and pressure-tested under 160 bar. All electrical gate-end boxes interlocks verified.',
      'Strata convergence monitors read 1.2 mm (within green threshold <3 mm). Ventilation air volume measured at 850 m3/min.',
      'Complete pending cable hanging in heading 2. Check roof bolt tell-tale at junction 4.',
      'Incoming shift in-charge to inspect junction 4 before commencing heavy cutting.',
      'Submitted', NOW() - INTERVAL '1 hour'
    );
  END IF;

  -- Handover 3: Night Shift Maintenance (Acknowledged)
  IF NOT EXISTS (
    SELECT 1 FROM public.shift_handovers 
    WHERE shift_date = v_yesterday AND shift_type = 'Shift 3 (Night)'
  ) THEN
    INSERT INTO public.shift_handovers (
      shift_date, shift_type, mine_section,
      outgoing_incharge_id, incoming_incharge_id,
      production_summary, equipment_status, safety_observations, pending_work, remarks,
      status, submitted_at, acknowledged_at, acknowledged_by_id
    ) VALUES (
      v_yesterday, 'Shift 3 (Night)', 'Shaft 2 Bottom & Incline',
      v_incharge_id, v_manager_id,
      '510 Tonnes extracted during maintenance & advance shift. Shaft winder completed 35 statutory hoist cycles.',
      'Winding rope greasing and visual inspection completed as per CMR Reg 86. Brake tests verified under full load.',
      'Sump water level at 1.4 m. Dewatering pump P-01 running continuously. No flammable gas traces in sump gallery.',
      'Transfer empty mine cars from pit-bottom sidings.',
      'Routine night maintenance shift completed in compliance with statutory safety checklist.',
      'Acknowledged', NOW() - INTERVAL '24 hours', NOW() - INTERVAL '23.5 hours', v_admin_id
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- 4. Seed DGMS Safety Management Plan Hazards & Actions (Phase 6)
  -- --------------------------------------------------------------------------

  -- Hazard 1: Strata Control (High Risk)
  SELECT id INTO v_h1_id FROM public.hazards_smp 
  WHERE title = 'Minor roof spalling and side fracturing between Pillar 14 and 15';
  IF v_h1_id IS NULL THEN
    INSERT INTO public.hazards_smp (
      mine_section, hazard_category, title, description, location_details,
      reported_by_id, likelihood, severity, risk_score, risk_level,
      status, initial_assessment_notes
    ) VALUES (
      'Panel A - Tailgate Roadway', 'Strata Control',
      'Minor roof spalling and side fracturing between Pillar 14 and 15',
      'Localized roof flaking (approx 150mm thick) and micro-fractures observed along the left rib of Tailgate 4. Strata tell-tale indicator shows 2.4mm expansion over last 2 shifts.',
      'Tailgate 4, Chainage 340m to 355m, Junction 3',
      v_supervisor_id, 3, 4, 12, 'High',
      'Action Assigned',
      'Immediate barricading with danger tape. Workers instructed not to linger in affected junction zone.'
    ) RETURNING id INTO v_h1_id;

    -- Corrective Actions for Hazard 1
    INSERT INTO public.safety_actions (
      hazard_id, action_description, action_type, assigned_to_id, due_date, status, created_by_id
    ) VALUES
      (v_h1_id, 'Install 6 additional resin-grouted roof bolts (22mm x 1.8m) with steel bearing plates along fractured zone.', 'Engineering Control', v_incharge_id, v_today + 2, 'In Progress', v_manager_id),
      (v_h1_id, 'Install dual-height mechanical tell-tale extensometer to monitor bed separation continuously.', 'Engineering Control', v_supervisor_id, v_today + 1, 'Pending', v_manager_id);
  END IF;

  -- Hazard 2: Ventilation & Mine Gases (Closed & Verified by Manager)
  SELECT id INTO v_h2_id FROM public.hazards_smp 
  WHERE title = 'Elevated methane concentration (0.85%) at roof cavity near Face Heading';
  IF v_h2_id IS NULL THEN
    INSERT INTO public.hazards_smp (
      mine_section, hazard_category, title, description, location_details,
      reported_by_id, likelihood, severity, risk_score, risk_level,
      status, initial_assessment_notes, verified_by_id, verified_at, verification_notes, closed_at
    ) VALUES (
      'Heading 3 Development Face', 'Ventilation & Mine Gases',
      'Elevated methane concentration (0.85%) at roof cavity near Face Heading',
      'Methanometer detected 0.85% CH4 in stagnant roof cavity behind auxiliary ventilation ducting during pre-shift inspection.',
      'Heading 3 return airway corner, 15m from face',
      v_supervisor_id, 3, 5, 15, 'High',
      'Closed',
      'Electric power isolated at section gate-end box immediately. Airflow diverted into cavity.',
      v_manager_id, NOW() - INTERVAL '4 hours',
      'Inspected face in presence of Safety Officer. Methane level brought down to 0.12% with continuous auxiliary ventilation.',
      NOW() - INTERVAL '3.5 hours'
    ) RETURNING id INTO v_h2_id;

    -- Action for Hazard 2
    INSERT INTO public.safety_actions (
      hazard_id, action_description, action_type, assigned_to_id, due_date, status, completed_at, completion_remarks, created_by_id
    ) VALUES (
      v_h2_id, 'Extend auxiliary ducting within 4.5m of face and install brattice curtain to flush roof cavity.',
      'Engineering Control', v_incharge_id, v_today, 'Completed', NOW() - INTERVAL '5 hours',
      'Ducting extended by 6m and high-velocity air stream directed to cavity. CH4 measured below 0.15%.',
      v_manager_id
    );
  END IF;

  -- Hazard 3: Haulage & Transport (Medium Risk - Action Completed)
  SELECT id INTO v_h3_id FROM public.hazards_smp 
  WHERE title = 'Worn idler roller generating localized friction and thermal buildup';
  IF v_h3_id IS NULL THEN
    INSERT INTO public.hazards_smp (
      mine_section, hazard_category, title, description, location_details,
      reported_by_id, likelihood, severity, risk_score, risk_level,
      status, initial_assessment_notes
    ) VALUES (
      'Main Incline Conveyor Belt 2', 'Haulage & Transport',
      'Worn idler roller generating localized friction and thermal buildup',
      'Thermal imaging gun detected roller surface temperature of 68 deg C on bottom return idler #42. Acoustic squeal heard during belt travel.',
      'Main Incline Belt 2, 120m from transfer chute',
      v_supervisor_id, 2, 3, 6, 'Medium',
      'Action Completed',
      'Water spray activated near roller. Belt inspected for edge fraying.'
    ) RETURNING id INTO v_h3_id;

    -- Action for Hazard 3
    INSERT INTO public.safety_actions (
      hazard_id, action_description, action_type, assigned_to_id, due_date, status, completed_at, completion_remarks, created_by_id
    ) VALUES (
      v_h3_id, 'Replace seized return idler assembly and inspect belt underside for abrasion.',
      'Substitution', v_incharge_id, v_today, 'Completed', NOW() - INTERVAL '2 hours',
      'Idler #42 replaced with new poly-coated roller. Bearing greased. Surface temperature dropped to ambient 26 deg C.',
      v_manager_id
    );
  END IF;

  -- Hazard 4: Inundation & Water (Low Risk - Open)
  SELECT id INTO v_h4_id FROM public.hazards_smp 
  WHERE title = 'Surface rainwater percolation into shaft water-catchment ring';
  IF v_h4_id IS NULL THEN
    INSERT INTO public.hazards_smp (
      mine_section, hazard_category, title, description, location_details,
      reported_by_id, likelihood, severity, risk_score, risk_level,
      status, initial_assessment_notes
    ) VALUES (
      'Shaft 2 Bottom Sump', 'Inundation & Water',
      'Surface rainwater percolation into shaft water-catchment ring',
      'Post-monsoon surface percolation flow rate increased from 40 LPM to 75 LPM in Shaft 2 garland ring.',
      'Shaft 2, 85m below collar, Ring #3',
      v_supervisor_id, 1, 3, 3, 'Low',
      'Open',
      'Main dewatering pump has capacity of 600 LPM, safely handling the inflow.'
    ) RETURNING id INTO v_h4_id;
  END IF;

  RAISE NOTICE 'CoalSafe database seeded successfully with 4 demo accounts, shift logs, and DGMS hazards.';
END $$;
