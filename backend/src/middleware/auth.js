const { supabase, isConfigured } = require('../config/supabase');

/**
 * Authentication Middleware
 * Validates Supabase JWT Bearer token and attaches user and profile to req.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Missing or malformed authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!isConfigured || !supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Authentication service is not configured on the server. Please check Supabase credentials.'
      });
    }

    // Verify user token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired session. Please log in again.',
        details: authError ? authError.message : undefined
      });
    }

    // Fetch trusted user profile & role from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, designation, mine_section, is_active')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Auth Middleware] Profile lookup error:', profileError.message);
    }

    // Default profile fallback if profile record was not created yet (least privileged role)
    req.user = user;
    req.profile = profile || {
      id: user.id,
      full_name: user.email.split('@')[0],
      role: 'Supervisor',
      designation: 'Staff',
      mine_section: 'General',
      is_active: true
    };

    if (req.profile.is_active === false) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    next();
  } catch (err) {
    console.error('[Auth Middleware] Exception:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal error verifying authentication.'
    });
  }
}

module.exports = { requireAuth };
