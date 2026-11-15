const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');

/**
 * ERP API Key Authentication Middleware
 * Enforces secure service-to-service communication with external ERP software (e.g. SAP / Oracle / Coal India ERP)
 */
function requireApiKey(req, res, next) {
  const configuredKey = process.env.ERP_API_KEY || 'coalsafe-erp-secret-2024';
  const incomingKey = req.headers['x-api-key'];

  if (!incomingKey || incomingKey !== configuredKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized. Valid x-api-key header is required for ERP integration access.'
    });
  }
  next();
}

router.use(requireApiKey);

/**
 * Check DB readiness
 */
function checkDbReady(req, res, next) {
  if (!isConfigured || !supabase) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service is not configured on the CoalSafe server.'
    });
  }
  next();
}

/**
 * GET /api/erp/status
 * Health and integration metadata check for ERP integration schedulers
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'CoalSafe Colliery Management System',
    version: '1.0.0',
    erpConnectorVersion: '1.0',
    exportCapabilities: ['shift_handovers', 'safety_management_plan', 'hazard_register'],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/erp/handovers
 * Read-only feed of shift handovers for ERP operational reporting
 */
router.get('/handovers', checkDbReady, async (req, res) => {
  try {
    const { date, section, status } = req.query;

    let query = supabase
      .from('shift_handovers')
      .select(`
        id,
        mine_section,
        shift_date,
        shift_type,
        production_summary,
        equipment_status,
        safety_observations,
        pending_work,
        status,
        submitted_at,
        acknowledged_at,
        created_at,
        outgoing:outgoing_incharge_id (id, full_name, role, designation),
        incoming:incoming_incharge_id (id, full_name, role, designation),
        acknowledged_by:acknowledged_by_id (id, full_name, role, designation)
      `)
      .order('shift_date', { ascending: false });

    if (date) query = query.eq('shift_date', date);
    if (section) query = query.eq('mine_section', section);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      count: data?.length || 0,
      extractedAt: new Date().toISOString(),
      data: data || []
    });
  } catch (err) {
    console.error('[ERP API] Handovers export error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract shift handover records for ERP export.'
    });
  }
});

/**
 * GET /api/erp/hazards
 * Read-only feed of workplace hazards and risk control metrics for enterprise safety systems
 */
router.get('/hazards', checkDbReady, async (req, res) => {
  try {
    const { section, risk_level, status } = req.query;

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
        verified_at,
        closed_at,
        created_at,
        reported_by:reported_by_id (id, full_name, role, designation),
        verified_by:verified_by_id (id, full_name, role, designation),
        safety_actions (
          id,
          action_description,
          action_type,
          status,
          due_date,
          completed_at,
          assigned_to:assigned_to_id (id, full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (section) query = query.eq('mine_section', section);
    if (risk_level) query = query.eq('risk_level', risk_level);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      count: data?.length || 0,
      extractedAt: new Date().toISOString(),
      data: data || []
    });
  } catch (err) {
    console.error('[ERP API] Hazards export error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract SMP hazard records for ERP export.'
    });
  }
});

module.exports = router;
