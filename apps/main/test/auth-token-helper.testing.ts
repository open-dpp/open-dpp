import { KeycloakAuthTestingGuard } from './keycloak-auth.guard.testing';
import { randomUUID } from 'crypto';
import { User } from '../src/users/domain/user';

const getKeycloakAuthToken = (
  userId: string,
  organizationIds: string[],
  keycloakAuthTestingGuard: KeycloakAuthTestingGuard,
) => {
  const organizationsString = `[${organizationIds.map((id) => id).join(',')}]`;
  const token = Buffer.from(organizationsString).toString('base64');
  keycloakAuthTestingGuard.tokenToUserMap.set(
    token,
    new User(userId, `${randomUUID()}@example.com`),
  );
  return `Bearer ${token}`;
};

export default getKeycloakAuthToken;
