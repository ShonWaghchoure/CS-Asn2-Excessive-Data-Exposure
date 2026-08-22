/**
 * VULNERABLE IMPLEMENTATION - Excessive Data Exposure via API
 * 
 * This endpoint returns ALL user fields including sensitive/internal data
 * that the frontend never displays. This is the vulnerability.
 * 
 * The mistake: Returning the entire user object from the database
 * instead of selecting only the fields the frontend actually needs.
 */

const users = require('../data/users.json');

/**
 * GET /api/v1/users/:id
 * VULNERABLE: Returns complete user object with all sensitive fields
 */
function getUserVulnerable(req, res) {
  const userId = parseInt(req.params.id, 10);
  
  // Find user in our "database"
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `No user found with ID ${userId}`
    });
  }
  
  // VULNERABILITY: Return the ENTIRE user object including sensitive fields
  // The frontend only needs: id, name, email, role, department, avatar, created_at
  // But we're also returning:
  // - internal_notes (HR/management notes)
  // - security_clearance (internal classification)
  // - last_password_change (security info)
  // - api_keys (SECRETS - should NEVER be returned!)
  // - admin_flags (privilege escalation info)
  // - salary_band (compensation data)
  // - performance_review_score (HR data)
  // - ssh_public_key (infrastructure access)
  // - two_factor_secret (2FA SECRET - CRITICAL SECURITY FAILURE!)
  
  console.log(`[VULNERABLE] User ${userId} requested - returning ALL fields including sensitive data`);
  
  // This is the vulnerable line - returning everything
  return res.json(user);
}

/**
 * GET /api/v1/users
 * VULNERABLE: List endpoint also exposes all fields for all users
 */
function listUsersVulnerable(req, res) {
  console.log('[VULNERABLE] Listing ALL users with ALL sensitive fields');
  return res.json(users);
}

module.exports = {
  getUserVulnerable,
  listUsersVulnerable
};