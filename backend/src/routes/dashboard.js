const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');

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

  let tablesInitialized = false;

  if (isConfigured && supabase) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Today's Shift Handovers count
      const { count: todayCount, error: todayErr } = await supabase
        .from('shift_handovers')
        .select('*', { count: 'exact', head: true })
        .eq('shift_date', today);

      // 2. Pending Acknowledgements count (Submitted but not yet acknowledged)
      const { count: pendingAckCount, error: pendingErr } = await supabase
        .from('shift_handovers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Submitted');

      // 3. Open Hazards count
      const { count: openHazardsCount, error: hazardsErr } = await supabase
        .from('hazards_smp')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open');

      // 4. Pending Safety Actions count
      const { count: pendingActionsCount, error: actionsErr } = await supabase
        .from('hazards_smp')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Closed');

      // If no table errors occurred, mark tables as initialized
      if (!todayErr && !pendingErr && !hazardsErr) {
        tablesInitialized = true;
        summary.todayHandovers = todayCount || 0;
        summary.pendingAcknowledgements = pendingAckCount || 0;
        summary.openHazards = openHazardsCount || 0;
        summary.pendingSafetyActions = pendingActionsCount || 0;
      }
    } catch (err) {
      console.warn('[Dashboard Summary] Query fallback:', err.message);
    }
  }

  res.status(200).json({
    status: 'ok',
    data: summary,
    tablesInitialized,
    message: tablesInitialized
      ? 'Summary counts fetched from database'
      : 'Live records ready. Operational log tables scheduled for creation in Phase 5 and 6.'
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

  let tablesInitialized = false;

  if (isConfigured && supabase) {
    try {
      // Fetch up to 5 recent handovers
      const { data: handovers, error: hErr } = await supabase
        .from('shift_handovers')
        .select('id, shift_date, shift_type, status, submitted_at, acknowledged_at')
        .order('submitted_at', { ascending: false })
        .limit(5);

      // Fetch up to 5 recent hazards
      const { data: hazards, error: hzErr } = await supabase
        .from('hazards_smp')
        .select('id, title, hazard_category, risk_score, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!hErr && !hzErr) {
        tablesInitialized = true;
        recentData.handovers = handovers || [];
        recentData.hazards = hazards || [];
      }
    } catch (err) {
      console.warn('[Dashboard Recent] Query fallback:', err.message);
    }
  }

  res.status(200).json({
    status: 'ok',
    data: recentData,
    tablesInitialized,
    message: tablesInitialized
      ? 'Recent activities fetched from database'
      : 'No activity records found. Tables will be populated during shift operations.'
  });
});

module.exports = router;
