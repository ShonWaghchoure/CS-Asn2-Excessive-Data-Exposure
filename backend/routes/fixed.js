/**
 * FIXED IMPLEMENTATION - Proper Data Exposure Control
 * 
 * This endpoint returns ONLY the fields the frontend actually needs.
 * Sensitive/internal fields are never included in the API response.
 * 
 * The fix: Explicitly select/whitelist only the safe fields needed by the frontend.
 */

const users = require('../data/users.json');

/**
 * Define the PUBLIC fields that are safe to expose via API
 * These are the ONLY fields the frontend needs for the user profile display
 */
const PUBLIC_USER_FIELDS = [
  'id',
  'name',
  'email',
  'role',
  'department',
  'avatar',
  'created_at'
];

/**
 * Helper: Create a safe public user object with only whitelisted fields
 * @param {Object} user - Full user object from database
 * @returns {Object} - Sanitized user object with only public fields
 */
function sanitizeUser(user) {
  const publicUser = {};
  for (const field of PUBLIC_USER_FIELDS) {
    if (user.hasOwnProperty(field)) {
      publicUser[field] = user[field];
    }
  }
  return publicUser;
}

/**
 * GET /api/v2/users/:id
 * FIXED: Returns only the fields the frontend needs
 */
function getUserFixed(req, res) {
  const userId = parseInt(req.params.id, 10);
  
  // Find user in our "database"
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `No user found with ID ${userId}`
    });
  }
  
  // FIXED: Return ONLY the public fields needed by the frontend
  const publicUser = sanitizeUser(user);
  
  console.log(`[FIXED] User ${userId} requested - returning ONLY public fields:`, Object.keys(publicUser));
  
  return res.json(publicUser);
}

/**
 * GET /api/v2/users
 * FIXED: List endpoint returns only public fields for all users
 */
function listUsersFixed(req, res) {
  const publicUsers = users.map(sanitizeUser);
  console.log('[FIXED] Listing users with ONLY public fields');
  return res.json(publicUsers);
}

module.exports = {
  getUserFixed,
  listUsersFixed,
  PUBLIC_USER_FIELDS,
  sanitizeUser
};