import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";

import { Environment } from "../../../aas/domain/environment";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { Passport } from "../../../passports/domain/passport";
import { isMemberOfPassportOrg } from "./permalink.application.service";

describe("isMemberOfPassportOrg", () => {
  const organizationId = randomUUID();
  const passport = Passport.create({
    id: randomUUID(),
    organizationId,
    environment: Environment.create({
      assetAdministrationShells: [],
      submodels: [],
      conceptDescriptions: [],
    }),
  });

  it("denies access when no access context is provided", () => {
    expect(isMemberOfPassportOrg(passport, undefined)).toBe(false);
  });

  it("denies access when the caller has no member role even if the org matches", () => {
    expect(isMemberOfPassportOrg(passport, { organizationId })).toBe(false);
  });

  it("denies access when the caller's organization differs from the passport's", () => {
    expect(
      isMemberOfPassportOrg(passport, {
        organizationId: randomUUID(),
        memberRole: MemberRole.OWNER,
      }),
    ).toBe(false);
  });

  it("grants access when the caller is a member of the passport's organization", () => {
    expect(isMemberOfPassportOrg(passport, { organizationId, memberRole: MemberRole.OWNER })).toBe(
      true,
    );
  });
});
