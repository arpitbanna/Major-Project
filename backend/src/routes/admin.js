const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Check DB readiness
function checkDbReady(req, res, next) {
  if (!isConfigured || !supabase) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service is not configured. Please check Supabase credentials in backend/.env'
    });
  }
  next();
}

// All admin routes require authenticated Admin role
router.use(requireAuth);
router.use(requireRole(['Admin']));

const VALID_ROLES = ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor'];

/**
 * GET /api/admin/users
 * Returns list of all personnel and profiles
 */
router.get('/users', checkDbReady, async (req, res) => {
  try {
    // 1. Fetch user profiles
    const { data: profiles, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, designation, mine_section, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;

    // 2. Try to fetch auth emails if service role key allows
    let emailsById = {};
    try {
      if (supabase.auth.admin && typeof supabase.auth.admin.listUsers === 'function') {
        const { data: authData } = await supabase.auth.admin.listUsers();
        if (authData?.users) {
          authData.users.forEach((u) => {
            emailsById[u.id] = u.email;
          });
        }
      }
    } catch (e) {
      console.warn('[Admin API] Could not list auth users:', e.message);
    }

    const enhanced = (profiles || []).map((p) => ({
      ...p,
      email: emailsById[p.id] || '—'
    }));

    res.status(200).json({
      status: 'ok',
      data: enhanced
    });
  } catch (err) {
    console.error('[Admin API] Fetch users error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve mine personnel list'
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user account with role assignment
 */
router.post('/users', checkDbReady, async (req, res) => {
  try {
    const { email, password, full_name, role, designation, mine_section } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, full name, and role are required.'
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (!supabase.auth.admin || typeof supabase.auth.admin.createUser !== 'function') {
      return res.status(503).json({
        status: 'error',
        message: 'Supabase admin service key is required to provision new user accounts.'
      });
    }

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role,
        designation: designation ? designation.trim() : 'Mine Staff',
        mine_section: mine_section ? mine_section.trim() : 'General'
      }
    });

    if (authErr) {
      return res.status(400).json({
        status: 'error',
        message: authErr.message
      });
    }

    // 2. Ensure profile is upserted with trusted role
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.user.id,
        full_name: full_name.trim(),
        role,
        designation: designation ? designation.trim() : 'Mine Staff',
        mine_section: mine_section ? mine_section.trim() : 'General',
        is_active: true
      })
      .select()
      .single();

    if (pErr) throw pErr;

    res.status(201).json({
      status: 'ok',
      message: `User account created successfully with role ${role}.`,
      data: {
        ...profile,
        email: authUser.user.email
      }
    });
  } catch (err) {
    console.error('[Admin API] Create user error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user account.'
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user profile, role, designation, or active status
 */
router.patch('/users/:id', checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, designation, mine_section, is_active } = req.body;

    // Prevent admin from deactivating self
    if (id === req.user.id && is_active === false) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot deactivate your own administrator account.'
      });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (role !== undefined) updates.role = role;
    if (designation !== undefined) updates.designation = designation.trim();
    if (mine_section !== undefined) updates.mine_section = mine_section.trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    updates.updated_at = new Date().toISOString();

    const { data: updatedProfile, error: pErr } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (pErr) throw pErr;

    res.status(200).json({
      status: 'ok',
      message: 'User profile updated successfully.',
      data: updatedProfile
    });
  } catch (err) {
    console.error('[Admin API] Update user error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user profile.'
    });
  }
});

module.exports = router;
