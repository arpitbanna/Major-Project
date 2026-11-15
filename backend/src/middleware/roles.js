/**
 * Role Authorization Middleware Factory
 * Ensures the authenticated user possesses one of the allowed roles.
 *
 * Roles supported:
 * - 'Admin'
 * - 'Mine Manager'
 * - 'Shift In-charge'
 * - 'Supervisor'
 *
 * @param  {...string} allowedRoles
 */
function requireRole(...roles) {
  // Support both requireRole('Admin', 'Mine Manager') and requireRole(['Admin', 'Mine Manager'])
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.profile || !req.profile.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: User profile or role could not be determined.'
      });
    }

    const userRole = req.profile.role;

    // Check if role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Role '${userRole}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = { requireRole };
