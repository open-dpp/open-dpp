import { randomUUID } from "node:crypto";
import { Organization } from "../src/organizations/domain/organization";
import { User } from "../src/users/domain/user";

const user1 = User.create({
  email: `${randomUUID()}@test.test`,
});
const user2 = User.create({
  email: `${randomUUID()}@test.test`,
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
