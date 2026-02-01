/**
 * Role-based route defaults. Used for post-login redirect and wrong-role redirect.
 * Extend ROLES and DEFAULT_ROUTES when adding new roles.
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLUB_ADMIN: 'club_admin',
  STUDENT: 'student',
};

export const DEFAULT_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
  [ROLES.CLUB_ADMIN]: '/club/dashboard',
  [ROLES.STUDENT]: '/student/dashboard',
};

export function getDefaultRoute(role) {
  return DEFAULT_ROUTES[role] ?? '/login';
}

export function getRoleLabel(role) {
  const labels = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.CLUB_ADMIN]: 'Club Admin',
    [ROLES.STUDENT]: 'Student',
  };
  return labels[role] ?? role;
}
