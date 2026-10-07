// Roles live in the existing admins.role column (free text, default
// 'Administrator'). A role listed in READ_ONLY_ROLES may only perform
// safe (non-mutating) HTTP methods - see middleware/auth.js.
const ROLES = {
  ADMIN: 'Administrator',
  DEMO: 'Demo Admin',
};

const READ_ONLY_ROLES = [ROLES.DEMO];

// Machine-readable code sent with the read-only 403 so the frontend can tell
// it apart from any other 403 (see frontend/src/api/axiosClient.js).
const DEMO_READ_ONLY_CODE = 'DEMO_READ_ONLY';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function isReadOnlyRole(role) {
  return READ_ONLY_ROLES.includes(role);
}

module.exports = { ROLES, READ_ONLY_ROLES, SAFE_METHODS, DEMO_READ_ONLY_CODE, isReadOnlyRole };
