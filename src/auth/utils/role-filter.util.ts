/**
 * Filters Keycloak technical roles and returns only business-relevant roles.
 *
 * @param roles All roles from Keycloak (realm_access.roles + resource_access roles)
 * @returns Clean business roles (e.g., ADMIN, USER, SECURITY, …)
 */
export function filterRelevantRoles(roles: string[]): string[] {
  if (!roles || roles.length === 0) {
    return [];
  }

  const IGNORED = [
    'offline_access',
    'uma_authorization',
    'default-roles-omnixys',
    'default-roles-master',
  ];

  return roles.filter((r) => !IGNORED.includes(r));
}
