const { supabase, isConfigured } = require('../src/config/supabase');

if (!isConfigured || !supabase) {
  console.error('Error: Supabase is not configured.');
  process.exit(1);
}

const DEMO_PASSWORD = 'CoalSafe@2026';

const DEMO_USERS = [
  {
    email: 'admin@colliery.in',
    password: DEMO_PASSWORD,
    full_name: 'Chief Administrator',
    role: 'Admin',
    designation: 'System & Safety Administrator',
    mine_section: 'Central Operations'
  },
  {
    email: 'manager@colliery.in',
    password: DEMO_PASSWORD,
    full_name: 'Er. Rajesh Sharma',
    role: 'Mine Manager',
    designation: 'First Class Mine Manager',
    mine_section: 'Colliery Sec-1'
  },
  {
    email: 'incharge@colliery.in',
    password: DEMO_PASSWORD,
    full_name: 'Amit Kumar Verma',
    role: 'Shift In-charge',
    designation: 'Overman Shift In-charge',
    mine_section: 'Panel A - Longwall'
  },
  {
    email: 'supervisor@colliery.in',
    password: DEMO_PASSWORD,
    full_name: 'Suresh Singh',
    role: 'Supervisor',
    designation: 'Mining Sirdar / Strata Inspector',
    mine_section: 'Panel A - Longwall'
  }
];

async function seed() {
  console.log('=== Step 1: Provisioning 4 Demo Users in Supabase Auth ===');
  const userMap = {};

  // 1. Fetch any existing auth users
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing auth users:', listError.message);
    process.exit(1);
  }
  const existingUsers = listData?.users || [];

  for (const u of DEMO_USERS) {
    let authUser = existingUsers.find((x) => x.email.toLowerCase() === u.email.toLowerCase());

    if (!authUser) {
      console.log(`Creating auth user: ${u.email}...`);
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          role: u.role,
          designation: u.designation,
          mine_section: u.mine_section
        }
      });

      if (createErr) {
        console.error(`Failed to create ${u.email}:`, createErr.message);
        process.exit(1);
      }
      authUser = created.user;
      console.log(`  -> Created with Auth ID: ${authUser.id}`);
    } else {
      console.log(`Auth user already exists: ${u.email} (ID: ${authUser.id}). Updating password and metadata...`);
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          role: u.role,
          designation: u.designation,
          mine_section: u.mine_section
        }
      });
    }

    // Upsert into public.user_profiles
    const { error: pErr } = await supabase.from('user_profiles').upsert({
      id: authUser.id,
      full_name: u.full_name,
      role: u.role,
      designation: u.designation,
      mine_section: u.mine_section,
      is_active: true
    });

    if (pErr) {
      console.error(`Failed to upsert profile for ${u.email}:`, pErr.message);
      process.exit(1);
    }
    userMap[u.role] = authUser.id;
    console.log(`  -> Profile synced for ${u.role}: ${u.full_name}`);
  }

  console.log('\n=== Step 2: Seeding Realistic Shift Handover Records ===');
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const handovers = [
    {
      shift_date: today,
      shift_type: 'Shift 1 (Morning)',
      mine_section: 'Panel A - Longwall Face',
      outgoing_incharge_id: userMap['Shift In-charge'],
      incoming_incharge_id: userMap['Mine Manager'],
      production_summary:
        '850 Tonnes coal extracted. Continuous miner CM-01 operated for 6.5 hours along shear face. Conveyor discharge rate steady at 140 TPH.',
      equipment_status:
        'CM-01 cutting picks inspected at mid-shift; 4 picks replaced. AFC chain tension within statutory limits. Feeder breaker FB-02 operational without trip.',
      safety_observations:
        'Gas monitoring: CH4 at 0.15% (permissible <0.5%), CO at 2 ppm. Airflow velocity measured at 1.8 m/s at face return. Roof strata sound with zero spalling.',
      pending_work:
        'Inspect auxiliary ventilation duct coupling at crosscut 4. Lubricate conveyor drive head pulleys.',
      remarks:
        'Maintain water spraying pressure on cutting drums above 12 bar to suppress respirable airborne dust.',
      status: 'Acknowledged',
      submitted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      acknowledged_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
      acknowledged_by_id: userMap['Mine Manager']
    },
    {
      shift_date: today,
      shift_type: 'Shift 2 (Afternoon)',
      mine_section: 'Panel A - Longwall Face',
      outgoing_incharge_id: userMap['Shift In-charge'],
      incoming_incharge_id: userMap['Mine Manager'],
      production_summary:
        '720 Tonnes coal dispatched. Operational halt for 45 mins due to shuttle car hydraulic hose replacement.',
      equipment_status:
        'Shuttle Car SC-03 hydraulic hose replaced and pressure-tested under 160 bar. All electrical gate-end boxes interlocks verified.',
      safety_observations:
        'Strata convergence monitors read 1.2 mm (within green threshold <3 mm). Ventilation air volume measured at 850 m3/min.',
      pending_work:
        'Complete pending cable hanging in heading 2. Check roof bolt tell-tale at junction 4.',
      remarks:
        'Incoming shift in-charge to inspect junction 4 before commencing heavy cutting.',
      status: 'Submitted',
      submitted_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      shift_date: yesterday,
      shift_type: 'Shift 3 (Night)',
      mine_section: 'Shaft 2 Bottom & Incline',
      outgoing_incharge_id: userMap['Shift In-charge'],
      incoming_incharge_id: userMap['Mine Manager'],
      production_summary:
        '510 Tonnes extracted during maintenance & advance shift. Shaft winder completed 35 statutory hoist cycles.',
      equipment_status:
        'Winding rope greasing and visual inspection completed as per CMR Reg 86. Brake tests verified under full load.',
      safety_observations:
        'Sump water level at 1.4 m. Dewatering pump P-01 running continuously. No flammable gas traces in sump gallery.',
      pending_work:
        'Transfer empty mine cars from pit-bottom sidings.',
      remarks:
        'Routine night maintenance shift completed in compliance with statutory safety checklist.',
      status: 'Acknowledged',
      submitted_at: yesterdayDate.toISOString(),
      acknowledged_at: yesterdayDate.toISOString(),
      acknowledged_by_id: userMap['Admin']
    }
  ];

  // Insert or refresh handovers
  const { data: existingHandovers } = await supabase
    .from('shift_handovers')
    .select('id, shift_date, shift_type');

  for (const h of handovers) {
    const found = (existingHandovers || []).find(
      (x) => x.shift_date === h.shift_date && x.shift_type === h.shift_type
    );
    if (!found) {
      const { error: insErr } = await supabase.from('shift_handovers').insert(h);
      if (insErr) console.warn('Handover insert notice:', insErr.message);
      else console.log(`  -> Inserted handover: ${h.shift_type} (${h.shift_date})`);
    } else {
      console.log(`  -> Handover exists: ${h.shift_type} (${h.shift_date})`);
    }
  }

  console.log('\n=== Step 3: Seeding DGMS Safety Management Plan Hazards & Actions ===');
  const hazards = [
    {
      mine_section: 'Panel A - Tailgate Roadway',
      hazard_category: 'Strata Control',
      title: 'Minor roof spalling and side fracturing between Pillar 14 and 15',
      description:
        'Localized roof flaking (approx 150mm thick) and micro-fractures observed along the left rib of Tailgate 4. Strata tell-tale indicator shows 2.4mm expansion over last 2 shifts.',
      location_details: 'Tailgate 4, Chainage 340m to 355m, Junction 3',
      reported_by_id: userMap['Supervisor'],
      likelihood: 3,
      severity: 4,
      risk_score: 12,
      risk_level: 'High',
      status: 'Action Assigned',
      initial_assessment_notes:
        'Immediate barricading with danger tape. Workers instructed not to linger in affected junction zone.',
      actions: [
        {
          action_description:
            'Install 6 additional resin-grouted roof bolts (22mm x 1.8m) with steel bearing plates along fractured zone.',
          action_type: 'Engineering Control',
          assigned_to_id: userMap['Shift In-charge'],
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'In Progress',
          created_by_id: userMap['Mine Manager']
        },
        {
          action_description:
            'Install dual-height mechanical tell-tale extensometer to monitor bed separation continuously.',
          action_type: 'Engineering Control',
          assigned_to_id: userMap['Supervisor'],
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Pending',
          created_by_id: userMap['Mine Manager']
        }
      ]
    },
    {
      mine_section: 'Heading 3 Development Face',
      hazard_category: 'Ventilation & Mine Gases',
      title: 'Elevated methane concentration (0.85%) at roof cavity near Face Heading',
      description:
        'Methanometer detected 0.85% CH4 in stagnant roof cavity behind auxiliary ventilation ducting during pre-shift inspection.',
      location_details: 'Heading 3 return airway corner, 15m from face',
      reported_by_id: userMap['Supervisor'],
      likelihood: 3,
      severity: 5,
      risk_score: 15,
      risk_level: 'High',
      status: 'Closed',
      initial_assessment_notes:
        'Electric power isolated at section gate-end box immediately. Airflow diverted into cavity.',
      verified_by_id: userMap['Mine Manager'],
      verified_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      verification_notes:
        'Inspected face in presence of Safety Officer. Methane level brought down to 0.12% with continuous auxiliary ventilation.',
      closed_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      actions: [
        {
          action_description:
            'Extend auxiliary ducting within 4.5m of face and install brattice curtain to flush roof cavity.',
          action_type: 'Engineering Control',
          assigned_to_id: userMap['Shift In-charge'],
          due_date: today,
          status: 'Completed',
          completed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          completion_remarks:
            'Ducting extended by 6m and high-velocity air stream directed to cavity. CH4 measured below 0.15%.',
          created_by_id: userMap['Mine Manager']
        }
      ]
    },
    {
      mine_section: 'Main Incline Conveyor Belt 2',
      hazard_category: 'Haulage & Transport',
      title: 'Worn idler roller generating localized friction and thermal buildup',
      description:
        'Thermal imaging gun detected roller surface temperature of 68 deg C on bottom return idler #42. Acoustic squeal heard during belt travel.',
      location_details: 'Main Incline Belt 2, 120m from transfer chute',
      reported_by_id: userMap['Supervisor'],
      likelihood: 2,
      severity: 3,
      risk_score: 6,
      risk_level: 'Medium',
      status: 'Action Completed',
      initial_assessment_notes:
        'Water spray activated near roller. Belt inspected for edge fraying.',
      actions: [
        {
          action_description:
            'Replace seized return idler assembly and inspect belt underside for abrasion.',
          action_type: 'Substitution',
          assigned_to_id: userMap['Shift In-charge'],
          due_date: today,
          status: 'Completed',
          completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completion_remarks:
            'Idler #42 replaced with new poly-coated roller. Bearing greased. Surface temperature dropped to ambient 26 deg C.',
          created_by_id: userMap['Mine Manager']
        }
      ]
    },
    {
      mine_section: 'Shaft 2 Bottom Sump',
      hazard_category: 'Inundation & Water',
      title: 'Surface rainwater percolation into shaft water-catchment ring',
      description:
        'Post-monsoon surface percolation flow rate increased from 40 LPM to 75 LPM in Shaft 2 garland ring.',
      location_details: 'Shaft 2, 85m below collar, Ring #3',
      reported_by_id: userMap['Supervisor'],
      likelihood: 1,
      severity: 3,
      risk_score: 3,
      risk_level: 'Low',
      status: 'Open',
      initial_assessment_notes:
        'Main dewatering pump has capacity of 600 LPM, safely handling the inflow.',
      actions: []
    }
  ];

  const { data: existingHazards } = await supabase.from('hazards_smp').select('id, title');

  for (const hz of hazards) {
    const found = (existingHazards || []).find((x) => x.title === hz.title);
    let hazardId = found?.id;

    if (!found) {
      const { actions, ...hazardRecord } = hz;
      const { data: inserted, error: hzErr } = await supabase
        .from('hazards_smp')
        .insert(hazardRecord)
        .select()
        .single();

      if (hzErr) {
        console.warn('Hazard insert notice:', hzErr.message);
      } else {
        hazardId = inserted.id;
        console.log(`  -> Inserted hazard: ${hz.title.substring(0, 40)}... (Score: ${hz.risk_score})`);

        // Insert actions
        for (const act of actions) {
          const { error: actErr } = await supabase
            .from('safety_actions')
            .insert({ ...act, hazard_id: hazardId });
          if (actErr) console.warn('Action insert notice:', actErr.message);
          else console.log(`     * Action: ${act.action_description.substring(0, 35)}... [${act.status}]`);
        }
      }
    } else {
      console.log(`  -> Hazard exists: ${hz.title.substring(0, 40)}...`);
    }
  }

  console.log('\n=== Seeding Finished Successfully ===');
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
