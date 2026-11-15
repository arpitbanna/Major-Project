const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');

/**
 * Middleware check to ensure database service is ready
 */
function checkDbReady(req, res, next) {
  if (!isConfigured || !supabase) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    });
  }
  next();
}

/**
 * GET /api/mines/stats
 * Aggregate statistics on real-world coal mining facilities
 */
router.get('/stats', checkDbReady, async (req, res) => {
  try {
    const { data: allMines, error } = await supabase
      .from('coal_mines')
      .select('mine_type, state');

    if (error) {
      // Graceful fallback if table is not yet seeded
      return res.status(200).json({
        status: 'ok',
        seeded: false,
        message: 'Coal mines catalog table has not been populated yet. Run seed_mines.sql in Supabase SQL editor.',
        stats: { total: 0, byType: {}, byState: {} }
      });
    }

    const total = allMines.length;
    const byType = {};
    const byState = {};

    allMines.forEach((m) => {
      const type = m.mine_type || 'Other';
      const state = m.state || 'Unknown';
      byType[type] = (byType[type] || 0) + 1;
      byState[state] = (byState[state] || 0) + 1;
    });

    res.status(200).json({
      status: 'ok',
      seeded: total > 0,
      stats: {
        total,
        byType,
        byState
      }
    });
  } catch (err) {
    console.error('[Mines API] Stats error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve coal mines statistics',
      details: err.message
    });
  }
});

/**
 * GET /api/mines
 * List real-world coal mining facilities from dataset with optional filters
 */
router.get('/', checkDbReady, async (req, res) => {
  try {
    const { type, state, search, limit = 50, offset = 0 } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    let query = supabase
      .from('coal_mines')
      .select('*', { count: 'exact' });

    if (type && type !== 'All') {
      query = query.eq('mine_type', type);
    }
    if (state && state !== 'All') {
      query = query.eq('state', state.toUpperCase());
    }
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,company_name.ilike.%${term}%,mine_id.ilike.%${term}%`);
    }

    query = query
      .order('name', { ascending: true })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    const { data: mines, count, error } = await query;

    if (error) {
      // Graceful fallback if table is not yet seeded
      return res.status(200).json({
        status: 'ok',
        seeded: false,
        total: 0,
        data: [],
        message: 'Coal mines catalog table has not been populated yet. Run seed_mines.sql in Supabase SQL editor.'
      });
    }

    res.status(200).json({
      status: 'ok',
      seeded: true,
      total: count || 0,
      limit: parsedLimit,
      offset: parsedOffset,
      data: mines || []
    });
  } catch (err) {
    console.error('[Mines API] List error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve coal mining facilities',
      details: err.message
    });
  }
});

/**
 * GET /api/mines/:mine_id
 * Retrieve specific coal mine facility by MSHA mine_id
 */
router.get('/:mine_id', checkDbReady, async (req, res) => {
  try {
    const { mine_id } = req.params;

    const { data: mine, error } = await supabase
      .from('coal_mines')
      .select('*')
      .eq('mine_id', mine_id)
      .single();

    if (error || !mine) {
      return res.status(404).json({
        status: 'error',
        message: `Coal mine facility with ID '${mine_id}' not found`
      });
    }

    res.status(200).json({
      status: 'ok',
      data: mine
    });
  } catch (err) {
    console.error('[Mines API] Detail error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve mine facility details',
      details: err.message
    });
  }
});

module.exports = router;
