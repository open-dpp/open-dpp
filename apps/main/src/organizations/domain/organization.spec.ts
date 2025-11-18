import { expect } from "@jest/globals";
import { User } from "../../users/domain/user";
import { Organization } from "./organization";

describe("organization", () => {
  it("creates a organization and add members", () => {
    const user = User.create({ email: "test@test.test" });
    const organization = Organization.create({
      name: "Test Org",
      ownedByUserId: user.id,
      createdByUserId: user.id,
      members: [user],
    });
    const user2 = User.create({ email: "test2@test.test" });
    const user3 = User.create({ email: "test3@test.test" });
    const user4 = User.create({ email: "test4@test.test" });
    organization.join(user);
    organization.join(user2);
    organization.join(user3);
    organization.join(user3);
    expect(organization.createdByUserId).toEqual(user.id);
    expect(organization.ownedByUserId).toEqual(user.id);
    expect(organization.members).toEqual([user, user2, user3]);
    expect(organization.isMember(user)).toBeTruthy();
    expect(
      organization.isMember(user4),
    ).toBeFalsy();
  });
});
