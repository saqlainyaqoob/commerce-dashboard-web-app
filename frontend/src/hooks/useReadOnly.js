import { useSelector } from 'react-redux';

// Must match ROLES.DEMO in backend/utils/roles.js. This only drives what the
// UI shows - the API enforces read-only on its own (backend/middleware/auth.js).
export const DEMO_ROLE = 'Demo Admin';

export default function useReadOnly() {
  return useSelector((state) => state.admin.profile?.role === DEMO_ROLE);
}
