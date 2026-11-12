const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

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
 * GET /api/handover/staff
 * Returns list of active personnel for incoming shift in-charge selection
 */
router.get('/staff', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { data: staff, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, designation, mine_section')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      data: staff || []
    });
  } catch (err) {
    console.error('[Handover API] Staff fetch error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch mining personnel list'
    });
  }
});

/**
 * GET /api/handover
 * List shift handovers with optional query filters (status, date, section)
 */
router.get('/', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { status, date, section } = req.query;

    let query = supabase
      .from('shift_handovers')
      .select(`
        id,
        mine_section,
        shift_date,
        shift_type,
        outgoing_incharge_id,
        incoming_incharge_id,
        status,
        submitted_at,
        acknowledged_at,
        created_at,
        outgoing:outgoing_incharge_id (id, full_name, role, designation),
        incoming:incoming_incharge_id (id, full_name, role, designation)
      `)
      .order('shift_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('shift_date', date);
    }
    if (section && section !== 'All') {
      query = query.eq('mine_section', section);
    }

    const { data: handovers, error } = await query;

    if (error) throw error;

    res.status(200).json({
      status: 'ok',
      data: handovers || []
    });
  } catch (err) {
    console.error('[Handover API] List error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve shift handover records',
      details: err.message
    });
  }
});

/**
 * GET /api/handover/:id
 * Retrieve individual shift handover record details
 */
router.get('/:id', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: handover, error } = await supabase
      .from('shift_handovers')
      .select(`
        *,
        outgoing:outgoing_incharge_id (id, full_name, role, designation, mine_section),
        incoming:incoming_incharge_id (id, full_name, role, designation, mine_section),
        acknowledged_by:acknowledged_by_id (id, full_name, role, designation)
      `)
      .eq('id', id)
      .single();

    if (error || !handover) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift handover record not found'
      });
    }

    res.status(200).json({
      status: 'ok',
      data: handover
    });
  } catch (err) {
    console.error('[Handover API] Fetch detail error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve handover details',
      details: err.message
    });
  }
});

/**
 * POST /api/handover
 * Create a new shift handover record (Draft or Submitted)
 */
router.post('/', requireAuth, checkDbReady, async (req, res) => {
  try {
    const {
      mine_section,
      shift_date,
      shift_type,
      incoming_incharge_id,
      production_summary,
      equipment_status,
      safety_observations,
      pending_work,
      remarks,
      submitImmediately
    } = req.body;

    // Field validations
    if (!mine_section || !mine_section.trim()) {
      return res.status(400).json({ status: 'error', message: 'Mine section is required.' });
    }
    if (!shift_date) {
      return res.status(400).json({ status: 'error', message: 'Shift date is required.' });
    }
    if (!shift_type) {
      return res.status(400).json({ status: 'error', message: 'Shift type/number is required.' });
    }

    // Role check: Only authorized personnel can create handovers
    const allowedCreators = ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor'];
    if (!allowedCreators.includes(req.profile.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to create shift handovers.'
      });
    }

    const isSubmitted = Boolean(submitImmediately);
    const status = isSubmitted ? 'Submitted' : 'Draft';
    const submitted_at = isSubmitted ? new Date().toISOString() : null;

    const payload = {
      mine_section: mine_section.trim(),
      shift_date,
      shift_type,
      outgoing_incharge_id: req.user.id, // Always enforce authenticated creator
      incoming_incharge_id: incoming_incharge_id || null,
      production_summary: production_summary || '',
      equipment_status: equipment_status || '',
      safety_observations: safety_observations || '',
      pending_work: pending_work || '',
      remarks: remarks || '',
      status,
      submitted_at,
    };

    const { data: newHandover, error } = await supabase
      .from('shift_handovers')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      status: 'ok',
      message: isSubmitted ? 'Shift handover submitted successfully' : 'Shift handover saved as draft',
      data: newHandover
    });
  } catch (err) {
    console.error('[Handover API] Create error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create shift handover',
      details: err.message
    });
  }
});

/**
 * PUT /api/handover/:id
 * Update an existing draft handover (Only creator or Admin can edit draft)
 */
router.put('/:id', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch existing record to check state and ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('shift_handovers')
      .select('id, outgoing_incharge_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ status: 'error', message: 'Handover record not found' });
    }

    // 2. Immutability checks
    if (existing.status === 'Acknowledged') {
      return res.status(400).json({
        status: 'error',
        message: 'Record locked: Acknowledged shift handovers cannot be modified.'
      });
    }
    if (existing.status === 'Submitted') {
      return res.status(400).json({
        status: 'error',
        message: 'Submitted shift handovers cannot be edited directly.'
      });
    }

    // 3. Ownership / Role check
    const isCreator = existing.outgoing_incharge_id === req.user.id;
    const isAdmin = req.profile.role === 'Admin';
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to edit this handover draft.'
      });
    }

    const {
      mine_section,
      shift_date,
      shift_type,
      incoming_incharge_id,
      production_summary,
      equipment_status,
      safety_observations,
      pending_work,
      remarks,
    } = req.body;

    const updatePayload = {
      mine_section: mine_section?.trim() || undefined,
      shift_date: shift_date || undefined,
      shift_type: shift_type || undefined,
      incoming_incharge_id: incoming_incharge_id || undefined,
      production_summary: production_summary ?? undefined,
      equipment_status: equipment_status ?? undefined,
      safety_observations: safety_observations ?? undefined,
      pending_work: pending_work ?? undefined,
      remarks: remarks ?? undefined,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateErr } = await supabase
      .from('shift_handovers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.status(200).json({
      status: 'ok',
      message: 'Draft handover updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[Handover API] Update error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update shift handover draft',
      details: err.message
    });
  }
});

/**
 * POST /api/handover/:id/submit
 * Submit a draft handover (Transitions Draft -> Submitted)
 */
router.post('/:id/submit', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('shift_handovers')
      .select('id, outgoing_incharge_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ status: 'error', message: 'Handover record not found' });
    }

    if (existing.status !== 'Draft') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot submit handover with status '${existing.status}'. Only drafts can be submitted.`
      });
    }

    const isCreator = existing.outgoing_incharge_id === req.user.id;
    const isAdmin = req.profile.role === 'Admin';
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the creator or administrator can submit this handover.'
      });
    }

    const { data: submitted, error: submitErr } = await supabase
      .from('shift_handovers')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (submitErr) throw submitErr;

    res.status(200).json({
      status: 'ok',
      message: 'Shift handover submitted successfully. Awaiting incoming shift acknowledgement.',
      data: submitted
    });
  } catch (err) {
    console.error('[Handover API] Submit error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit shift handover',
      details: err.message
    });
  }
});

/**
 * POST /api/handover/:id/acknowledge
 * Acknowledge an incoming shift handover (Transitions Submitted -> Acknowledged, permanently locked)
 */
router.post('/:id/acknowledge', requireAuth, checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('shift_handovers')
      .select('id, outgoing_incharge_id, incoming_incharge_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ status: 'error', message: 'Handover record not found' });
    }

    // 1. Status check: Must be in 'Submitted' state
    if (existing.status === 'Acknowledged') {
      return res.status(400).json({
        status: 'error',
        message: 'This shift handover has already been acknowledged and locked.'
      });
    }
    if (existing.status === 'Draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Draft handovers must be submitted by the outgoing shift before acknowledgement.'
      });
    }

    // 2. Four-eyes principle: Creator cannot acknowledge their own shift handover
    if (existing.outgoing_incharge_id === req.user.id && req.profile.role !== 'Admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Cross-shift verification rule: You cannot acknowledge your own outgoing shift handover.'
      });
    }

    // 3. Authorization check: Must be designated incoming in-charge, or a Mine Manager/Shift In-charge/Admin
    const isDesignatedIncoming = existing.incoming_incharge_id === req.user.id;
    const isSupervisoryRole = ['Admin', 'Mine Manager', 'Shift In-charge'].includes(req.profile.role);

    if (!isDesignatedIncoming && !isSupervisoryRole) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: You are not authorized to acknowledge this incoming shift handover.'
      });
    }

    // 4. Update status to Acknowledged and record timestamps
    const { data: acknowledged, error: ackErr } = await supabase
      .from('shift_handovers')
      .update({
        status: 'Acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by_id: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (ackErr) throw ackErr;

    res.status(200).json({
      status: 'ok',
      message: 'Shift handover successfully acknowledged and verified. Record is now locked.',
      data: acknowledged
    });
  } catch (err) {
    console.error('[Handover API] Acknowledge error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to acknowledge shift handover',
      details: err.message
    });
  }
});

module.exports = router;
