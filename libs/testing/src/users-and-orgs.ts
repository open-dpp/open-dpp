import { randomUUID } from 'crypto';
import { KeycloakUserInToken } from '@app/auth/keycloak-auth/KeycloakUserInToken';
import { Organization } from '../../../apps/main/src/organizations/domain/organization';

const createKeycloakUserInToken = (
  id: string = randomUUID(),
): KeycloakUserInToken => {
  const email = `${id}@test.test`;
  return {
    sub: id,
    email: email,
    name: id,
    preferred_username: email,
    email_verified: true,
    memberships: [],
  };
};

// Keycloak user objects (plain objects with user data)
const user1org1 = createKeycloakUserInToken();
const user2org1 = createKeycloakUserInToken();
const user1org2 = createKeycloakUserInToken();
const user2org2 = createKeycloakUserInToken();
const user1org3 = createKeycloakUserInToken();

// Array of all keycloak users
const keycloakUsers = [
  user1org1,
  user2org1,
  user1org2,
  user2org2,
  user1org3,
].map((k) => ({
  id: k.sub,
  email: k.email,
  firstName: k.name,
  lastName: '',
  emailVerified: true,
  username: k.preferred_username,
}));

// Organization domain objects
const org1 = Organization.fromPlain({
  id: 'org1',
  name: 'Organization 1',
  members: [], // [userObj1, userObj2],
  createdByUserId: user1org1.sub,
  ownedByUserId: user1org1.sub,
});

const org2 = Organization.fromPlain({
  id: 'org2',
  name: 'Organization 2',
  members: [], // [userObj3, userObj4],
  createdByUserId: user1org2.sub,
  ownedByUserId: user1org2.sub,
});

const org3 = Organization.fromPlain({
  id: 'org3',
  name: 'Organization 3',
  members: [], // [userObj5],
  createdByUserId: user1org3.sub,
  ownedByUserId: user1org3.sub,
});

// Array of all organizations
const organizations = [org1, org2, org3];

export {
  keycloakUsers,
  organizations,
  org1,
  org2,
  org3,
  user1org1,
  user2org1,
  user1org2,
  user2org2,
  user1org3,
  createKeycloakUserInToken,
};
