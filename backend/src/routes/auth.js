const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { isConfigured } = require('../config/supabase');

/**
 * Public route to verify Supabase Auth status
 * GET /api/auth/status
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    authConfigured: isConfigured,
    message: isConfigured
      ? 'Supabase Auth service is configured and active.'
      : 'Supabase credentials are not configured. Update SUPABASE_URL and keys in .env'
  });
});

/**
 * Protected route: Get authenticated user's verified identity and profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    status: 'ok',
    user: {
      id: req.user.id,
      email: req.user.email,
      lastSignInAt: req.user.last_sign_in_at
    },
    profile: req.profile
  });
});

/**
 * Protected route: Test role-based authorization (Mine Manager or Admin only)
 * GET /api/auth/test-manager
 */
router.get('/test-manager', requireAuth, requireRole('Mine Manager', 'Admin'), (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Welcome! You have verified Mine Manager / Admin permissions.',
    userRole: req.profile.role
  });
});

module.exports = router;
