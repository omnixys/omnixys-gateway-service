import type { KeycloakRawOutput } from '../dto/kc-rwa.dto.js';
import { filterRelevantRoles } from './role-filter.util.js';

/**
 * Extracts all roles from a raw Keycloak JWT payload:
 * - realm_access.roles
 * - resource_access.*.roles
 * And filters out system-level roles.
 */
export function extractUserRoles(raw: KeycloakRawOutput): string[] {
  const realmRoles = raw.realm_access?.roles ?? [];

  const resourceRoles: string[] = [];

  if (raw.resource_access) {
    for (const resource of Object.values(raw.resource_access)) {
      resourceRoles.push(...(resource.roles ?? []));
    }
  }

  const allRoles = [...realmRoles, ...resourceRoles];

  return filterRelevantRoles(allRoles);
}
