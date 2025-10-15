import { createKeycloakUserInToken } from "@open-dpp/testing";
import { Organization } from "../src/organizations/domain/organization";
import { User } from "../src/users/domain/user";

const keycloakUser1 = createKeycloakUserInToken();
const user1 = User.create({
  email: keycloakUser1.email,
  keycloakUserId: keycloakUser1.sub,
});
const keycloakUser2 = createKeycloakUserInToken();
const user2 = User.create({
  email: keycloakUser2.email,
  keycloakUserId: keycloakUser2.sub,
});
const org1 = Organization.create({
  name: "organization-1-test",
  ownedByUserId: user1.id,
  createdByUserId: user1.id,
  members: [user1],
});
const org2 = Organization.create({
  name: "organization-2-test",
  ownedByUserId: user2.id,
  createdByUserId: user2.id,
  members: [user2],
});
const TestUsersAndOrganizations = {
  keycloakUsers: {
    keycloakUser1,
    keycloakUser2,
  },
  users: {
    user1,
    user2,
  },
  organizations: {
    org1,
    org2,
  },
};

export default TestUsersAndOrganizations;
