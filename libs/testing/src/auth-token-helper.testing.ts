import { KeycloakAuthTestingGuard } from './keycloak-auth.guard.testing';
import { createKeycloakUserInToken } from './users-and-orgs';

const getKeycloakAuthToken = (
  userId: string,
  organizationIds: string[],
  keycloakAuthTestingGuard: KeycloakAuthTestingGuard,
) => {
  const organizationsString = `[${organizationIds.map((id) => id).join(',')}]`;
  const token = Buffer.from(organizationsString).toString('base64');
  const user = createKeycloakUserInToken(userId);
  keycloakAuthTestingGuard.tokenToUserMap.set(token, user);
  return `Bearer ${token}`;
};

export default getKeycloakAuthToken;
