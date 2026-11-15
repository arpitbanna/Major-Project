const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// Protect all dashboard endpoints with authentication
router.use(requireAuth);

/**
 * GET /api/dashboard/summary
 * Returns operational summary counts from actual database records.
 * Returns 0s if database is not configured or tables are not created yet.
 */
router.get('/summary', async (req, res) => {
  const summary = {
    todayHandovers: 0,
    pendingAcknowledgements: 0,
    openHazards: 0,
    pendingSafetyActions: 0,
  };

  let handoversTableReady = false;
  let hazardsTableReady = false;

  if (isConfigured && supabase) {
    // 1. Shift Handovers count (Phase 5)
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count: todayCount, error: todayErr } = await supabase
        .from('shift_handovers')
        .select('*', { count: 'exact', head: true })
        .eq('shift_date', today);

      const { count: pendingAckCount, error: pendingErr } = await supabase
        .from('shift_handovers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Submitted');

      if (!todayErr && !pendingErr) {
        handoversTableReady = true;
        summary.todayHandovers = todayCount || 0;
        summary.pendingAcknowledgements = pendingAckCount || 0;
      }
    } catch (err) {
      console.warn('[Dashboard Summary] Handover query note:', err.message);
    }

    // 2. Hazards & SMP count (Phase 6)
    try {
      const { count: openHazardsCount, error: hazardsErr } = await supabase
        .from('hazards_smp')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open');

      const { count: pendingActionsCount, error: actionsErr } = await supabase
        .from('hazards_smp')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Closed');

      if (!hazardsErr) {
        hazardsTableReady = true;
        summary.openHazards = openHazardsCount || 0;
        summary.pendingSafetyActions = pendingActionsCount || 0;
      }
    } catch (err) {
      console.warn('[Dashboard Summary] Hazards query note:', err.message);
    }
  }

  res.status(200).json({
    status: 'ok',
    data: summary,
    tablesInitialized: handoversTableReady,
    handoversTableReady,
    hazardsTableReady,
    message: handoversTableReady
      ? 'Live shift handover counts retrieved from database'
      : 'Ready. Tables will be populated during daily shift operations.'
  });
});

/**
 * GET /api/dashboard/recent
 * Returns recent shift handovers and safety actions from actual database records.
 */
router.get('/recent', async (req, res) => {
  const recentData = {
    handovers: [],
    hazards: [],
    pendingActions: []
  };

  let handoversTableReady = false;
  let hazardsTableReady = false;

  if (isConfigured && supabase) {
    // 1. Fetch up to 5 recent handovers (Phase 5)
    try {
      const { data: handovers, error: hErr } = await supabase
        .from('shift_handovers')
        .select('id, shift_date, shift_type, status, submitted_at, acknowledged_at, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!hErr) {
        handoversTableReady = true;
        recentData.handovers = handovers || [];
      }
    } catch (err) {
      console.warn('[Dashboard Recent] Handover feed note:', err.message);
    }

    // 2. Fetch up to 5 recent hazards (Phase 6)
    try {
      const { data: hazards, error: hzErr } = await supabase
        .from('hazards_smp')
        .select('id, title, hazard_category, risk_score, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!hzErr) {
        hazardsTableReady = true;
        recentData.hazards = hazards || [];
      }
    } catch (err) {
      console.warn('[Dashboard Recent] Hazard feed note:', err.message);
    }
  }

  res.status(200).json({
    status: 'ok',
    data: recentData,
    tablesInitialized: handoversTableReady,
    handoversTableReady,
    hazardsTableReady,
    message: handoversTableReady
      ? 'Recent shift handovers retrieved from database'
      : 'No activity records found yet. Handover records will appear here.'
  });
});

module.exports = router;
