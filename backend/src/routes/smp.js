const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

/**
 * Pure helper function to calculate risk score and risk level
 * Conforms to standard 5x5 mining risk assessment methodology
 *
 * Likelihood: 1 (Rare) to 5 (Almost Certain)
 * Severity:   1 (Insignificant) to 5 (Catastrophic)
 *
 * Risk Score = Likelihood x Severity (1 to 25)
 * Bands:
 *  1 - 4:   Low      (Green  - Routine operational control)
 *  5 - 9:   Medium   (Yellow - Planned corrective mitigation)
 *  10 - 16: High     (Orange - Urgent management attention)
 *  17 - 25: Extreme  (Red    - Immediate stoppage & priority intervention)
 */
function calculateRisk(likelihood, severity) {
  const l = Math.max(1, Math.min(5, parseInt(likelihood, 10) || 1));
  const s = Math.max(1, Math.min(5, parseInt(severity, 10) || 1));
  const score = l * s;

  let level = 'Low';
  let actionAdvice = 'Routine supervision and continuous monitoring.';

  if (score >= 17) {
    level = 'Extreme';
    actionAdvice = 'Immediate stoppage of hazardous operation. Priority intervention required.';
  } else if (score >= 10) {
    level = 'High';
    actionAdvice = 'Urgent corrective action and direct management oversight.';
  } else if (score >= 5) {
    level = 'Medium';
    actionAdvice = 'Planned mitigation measures with assigned responsibility and target date.';
  }

  return {
    likelihood: l,
    severity: s,
    score,
    level,
    actionAdvice
  };
}

/**
 * Database readiness check middleware
 */
function checkDbReady(req, res, next) {
  if (!isConfigured || !supabase) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service is not configured. Please check Supabase credentials.'
    });
  }
  next();
}

// All SMP endpoints require authentication
router.use(requireAuth);

/**
 * GET /api/smp/matrix
 * Returns risk matrix definitions, categories, and severity/likelihood scales
 */
router.get('/matrix', (req, res) => {
  res.status(200).json({
    status: 'ok',
    data: {
      likelihoodScale: [
        { level: 1, label: 'Rare', description: 'Highly unlikely to occur in mine lifespan (<1%)' },
        { level: 2, label: 'Unlikely', description: 'Could occur occasionally under adverse conditions' },
        { level: 3, label: 'Possible', description: 'May occur several times during typical mining operations' },
        { level: 4, label: 'Likely', description: 'Expected to occur frequently or on regular shifts' },
        { level: 5, label: 'Almost Certain', description: 'Continuous hazard or inevitable without immediate intervention' }
      ],
      severityScale: [
        { level: 1, label: 'Insignificant', description: 'First aid treatment; negligible damage or interruption' },
        { level: 2, label: 'Minor', description: 'Minor injury with short lost-time; localized minor damage' },
        { level: 3, label: 'Moderate', description: 'Medical treatment case; section temporary stoppage (<1 shift)' },
        { level: 4, label: 'Major', description: 'Serious reportable injury; extensive equipment or strata failure' },
        { level: 5, label: 'Catastrophic', description: 'Fatality or permanent disability; mine-wide stoppage' }
      ],
      riskBands: [
        { name: 'Low', min: 1, max: 4, color: '#10b981', action: 'Routine supervision and standard operating procedures.' },
        { name: 'Medium', min: 5, max: 9, color: '#f59e0b', action: 'Planned corrective action with assigned timeline.' },
        { name: 'High', min: 10, max: 16, color: '#f97316', action: 'Urgent remedial action; direct supervisory oversight.' },
        { name: 'Extreme', min: 17, max: 25, color: '#ef4444', action: 'Immediate operational stoppage in zone until mitigated.' }
      ],
      hazardCategories: [
        'Strata Control',
        'Ventilation & Mine Gases',
        'Inundation & Water',
        'Haulage & Transport',
        'Machinery & Electrical',
        'Fire & Spontaneous Combustion',
        'Dust & Airborne Hazards',
        'General / Other'
      ],
      actionTypes: [
        'Elimination',
        'Substitution',
        'Engineering Control',
        'Administrative Control',
        'PPE'
      ]
    }
  });
});

/**
 * GET /api/smp/hazards
 * List hazards with optional query filters (status, category, risk_level, section)
 */
router.get('/hazards', checkDbReady, async (req, res) => {
  try {
    const { status, category, risk_level, section } = req.query;

    let query = supabase
      .from('hazards_smp')
      .select(`
        id,
        mine_section,
        hazard_category,
        title,
        description,
        location_details,
        likelihood,
        severity,
        risk_score,
        risk_level,
        status,
        initial_assessment_notes,
        created_at,
        updated_at,
        reported_by:reported_by_id (id, full_name, role, designation),
        verified_by:verified_by_id (id, full_name, role, designation),
        safety_actions (id, status)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (category && category !== 'All') {
      query = query.eq('hazard_category', category);
    }
    if (risk_level && risk_level !== 'All') {
      query = query.eq('risk_level', risk_level);
    }
    if (section && section !== 'All') {
      query = query.eq('mine_section', section);
    }

    const { data: hazards, error } = await query;
    if (error) throw error;

    // Enhance hazards with action counts
    const formatted = (hazards || []).map((h) => {
      const actions = h.safety_actions || [];
      const totalActions = actions.length;
      const completedActions = actions.filter((a) => a.status === 'Completed').length;
      return {
        ...h,
        totalActions,
        completedActions
      };
    });

    res.status(200).json({
      status: 'ok',
      data: formatted
    });
  } catch (err) {
    console.error('[SMP API] List hazards error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve workplace hazards list.'
    });
  }
});

/**
 * POST /api/smp/hazards
 * Report a new hazard
 */
router.post('/hazards', checkDbReady, async (req, res) => {
  try {
    const {
      mine_section,
      hazard_category,
      title,
      description,
      location_details,
      likelihood = 1,
      severity = 1,
      initial_assessment_notes = ''
    } = req.body;

    // Validation
    if (!mine_section || !hazard_category || !title || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Mine section, category, title, and description are required.'
      });
    }

    // Server-enforced risk score calculation
    const risk = calculateRisk(likelihood, severity);

    const newRecord = {
      mine_section: mine_section.trim(),
      hazard_category,
      title: title.trim(),
      description: description.trim(),
      location_details: location_details ? location_details.trim() : null,
      reported_by_id: req.user.id,
      likelihood: risk.likelihood,
      severity: risk.severity,
      risk_score: risk.score,
      risk_level: risk.level,
      status: 'Open',
      initial_assessment_notes: initial_assessment_notes ? initial_assessment_notes.trim() : null
    };

    const { data, error } = await supabase
      .from('hazards_smp')
      .insert(newRecord)
      .select(`
        *,
        reported_by:reported_by_id (id, full_name, role, designation)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      status: 'ok',
      message: 'Workplace hazard reported successfully.',
      data
    });
  } catch (err) {
    console.error('[SMP API] Create hazard error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record workplace hazard.'
    });
  }
});

/**
 * GET /api/smp/hazards/:id
 * Retrieve full details of a single hazard including corrective actions
 */
router.get('/hazards/:id', checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: hazard, error: hError } = await supabase
      .from('hazards_smp')
      .select(`
        *,
        reported_by:reported_by_id (id, full_name, role, designation),
        verified_by:verified_by_id (id, full_name, role, designation)
      `)
      .eq('id', id)
      .single();

    if (hError || !hazard) {
      return res.status(404).json({
        status: 'error',
        message: 'Hazard record not found.'
      });
    }

    // Fetch related safety actions
    const { data: actions, error: aError } = await supabase
      .from('safety_actions')
      .select(`
        *,
        assigned_to:assigned_to_id (id, full_name, role, designation),
        created_by:created_by_id (id, full_name, role, designation)
      `)
      .eq('hazard_id', id)
      .order('created_at', { ascending: true });

    if (aError) {
      console.warn('[SMP API] Actions lookup warning:', aError.message);
    }

    res.status(200).json({
      status: 'ok',
      data: {
        ...hazard,
        actions: actions || []
      }
    });
  } catch (err) {
    console.error('[SMP API] Hazard detail error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hazard details.'
    });
  }
});

/**
 * PUT /api/smp/hazards/:id
 * Update hazard descriptive details (Only allowed if status is not 'Closed')
 */
router.put('/hazards/:id', checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;
    const { mine_section, hazard_category, title, description, location_details } = req.body;

    // Check existing record
    const { data: existing, error: findError } = await supabase
      .from('hazards_smp')
      .select('status, reported_by_id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Hazard record not found.'
      });
    }

    if (existing.status === 'Closed') {
      return res.status(400).json({
        status: 'error',
        message: 'Closed hazard records are locked for statutory compliance and cannot be edited.'
      });
    }

    const updates = {};
    if (mine_section) updates.mine_section = mine_section.trim();
    if (hazard_category) updates.hazard_category = hazard_category;
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (location_details !== undefined) updates.location_details = location_details;

    const { data, error } = await supabase
      .from('hazards_smp')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      message: 'Hazard details updated successfully.',
      data
    });
  } catch (err) {
    console.error('[SMP API] Update hazard error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update hazard details.'
    });
  }
});

/**
 * POST /api/smp/hazards/:id/assess
 * Re-assess risk parameters (likelihood, severity)
 */
router.post('/hazards/:id/assess', checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;
    const { likelihood, severity, assessment_notes } = req.body;

    const { data: existing, error: findError } = await supabase
      .from('hazards_smp')
      .select('status')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Hazard record not found.'
      });
    }

    if (existing.status === 'Closed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot re-assess a closed hazard.'
      });
    }

    const risk = calculateRisk(likelihood, severity);

    const updates = {
      likelihood: risk.likelihood,
      severity: risk.severity,
      risk_score: risk.score,
      risk_level: risk.level,
      initial_assessment_notes: assessment_notes || null,
      status: existing.status === 'Open' ? 'Under Review' : existing.status
    };

    const { data, error } = await supabase
      .from('hazards_smp')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      message: `Risk re-assessed. New Score: ${risk.score} (${risk.level})`,
      data
    });
  } catch (err) {
    console.error('[SMP API] Assess hazard error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assess risk parameters.'
    });
  }
});

/**
 * POST /api/smp/hazards/:id/actions
 * Assign a corrective safety action to a hazard
 */
router.post(
  '/hazards/:id/actions',
  checkDbReady,
  requireRole(['Admin', 'Mine Manager', 'Shift In-charge']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action_description, action_type = 'Engineering Control', assigned_to_id, due_date } = req.body;

      if (!action_description) {
        return res.status(400).json({
          status: 'error',
          message: 'Action description is required.'
        });
      }

      // Check hazard existence and status
      const { data: hazard, error: hError } = await supabase
        .from('hazards_smp')
        .select('status')
        .eq('id', id)
        .single();

      if (hError || !hazard) {
        return res.status(404).json({
          status: 'error',
          message: 'Hazard record not found.'
        });
      }

      if (hazard.status === 'Closed') {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot add corrective actions to a closed hazard.'
        });
      }

      const newAction = {
        hazard_id: id,
        action_description: action_description.trim(),
        action_type,
        assigned_to_id: assigned_to_id || null,
        due_date: due_date || null,
        status: 'Pending',
        created_by_id: req.user.id
      };

      const { data: action, error: aError } = await supabase
        .from('safety_actions')
        .insert(newAction)
        .select(`
          *,
          assigned_to:assigned_to_id (id, full_name, role, designation)
        `)
        .single();

      if (aError) throw aError;

      // Update hazard status to 'Action Assigned' if it was 'Open' or 'Under Review'
      if (hazard.status === 'Open' || hazard.status === 'Under Review') {
        await supabase
          .from('hazards_smp')
          .update({ status: 'Action Assigned' })
          .eq('id', id);
      }

      res.status(201).json({
        status: 'ok',
        message: 'Corrective action assigned successfully.',
        data: action
      });
    } catch (err) {
      console.error('[SMP API] Create action error:', err.message);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign corrective action.'
      });
    }
  }
);

/**
 * PATCH /api/smp/actions/:actionId
 * Update corrective action status (e.g. In Progress, Completed)
 */
router.patch('/actions/:actionId', checkDbReady, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status, completion_remarks } = req.body;

    if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid status (Pending, In Progress, or Completed) is required.'
      });
    }

    const updates = { status };
    if (status === 'Completed') {
      updates.completed_at = new Date().toISOString();
      if (completion_remarks) {
        updates.completion_remarks = completion_remarks.trim();
      }
    }

    const { data: updatedAction, error } = await supabase
      .from('safety_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();

    if (error) throw error;

    // Check if all actions for this hazard are now Completed
    if (status === 'Completed') {
      const { data: allActions } = await supabase
        .from('safety_actions')
        .select('status')
        .eq('hazard_id', updatedAction.hazard_id);

      const allCompleted = (allActions || []).every((a) => a.status === 'Completed');
      if (allCompleted) {
        await supabase
          .from('hazards_smp')
          .update({ status: 'Action Completed' })
          .eq('id', updatedAction.hazard_id);
      }
    }

    res.status(200).json({
      status: 'ok',
      message: `Action updated to status: ${status}`,
      data: updatedAction
    });
  } catch (err) {
    console.error('[SMP API] Action update error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update corrective action status.'
    });
  }
});

/**
 * POST /api/smp/hazards/:id/verify
 * Mine Manager / Admin verification of mitigation measures
 */
router.post(
  '/hazards/:id/verify',
  checkDbReady,
  requireRole(['Admin', 'Mine Manager']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { verification_notes } = req.body;

      const { data: hazard, error: findError } = await supabase
        .from('hazards_smp')
        .select('status')
        .eq('id', id)
        .single();

      if (findError || !hazard) {
        return res.status(404).json({
          status: 'error',
          message: 'Hazard record not found.'
        });
      }

      if (hazard.status === 'Closed') {
        return res.status(400).json({
          status: 'error',
          message: 'This hazard record is already closed and locked.'
        });
      }

      const updates = {
        verified_by_id: req.user.id,
        verified_at: new Date().toISOString(),
        verification_notes: verification_notes ? verification_notes.trim() : null
      };

      const { data, error } = await supabase
        .from('hazards_smp')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          verified_by:verified_by_id (id, full_name, role, designation)
        `)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'ok',
        message: 'Hazard control measures verified by Mine Manager.',
        data
      });
    } catch (err) {
      console.error('[SMP API] Verification error:', err.message);
      res.status(500).json({
        status: 'error',
        message: 'Failed to record manager verification.'
      });
    }
  }
);

/**
 * POST /api/smp/hazards/:id/close
 * Formal closure of hazard and locking of audit trail
 */
router.post(
  '/hazards/:id/close',
  checkDbReady,
  requireRole(['Admin', 'Mine Manager']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: hazard, error: findError } = await supabase
        .from('hazards_smp')
        .select('status, verified_at')
        .eq('id', id)
        .single();

      if (findError || !hazard) {
        return res.status(404).json({
          status: 'error',
          message: 'Hazard record not found.'
        });
      }

      if (hazard.status === 'Closed') {
        return res.status(400).json({
          status: 'error',
          message: 'Hazard is already closed.'
        });
      }

      const updates = {
        status: 'Closed',
        closed_at: new Date().toISOString()
      };

      if (!hazard.verified_at) {
        updates.verified_by_id = req.user.id;
        updates.verified_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('hazards_smp')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'ok',
        message: 'Hazard successfully closed and locked for statutory audit.',
        data
      });
    } catch (err) {
      console.error('[SMP API] Closure error:', err.message);
      res.status(500).json({
        status: 'error',
        message: 'Failed to close hazard.'
      });
    }
  }
);

module.exports = router;
module.exports.calculateRisk = calculateRisk;
