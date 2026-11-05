import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { DirectGuestAccess } from "./direct-guest-access";
import { guestAccessFromPlain } from "./guest-access-registry";
import { GuestRole } from "./guest-role.enum";

describe("guestAccessFromPlain", () => {
  it("restores the class registered for the kind", () => {
    const access = DirectGuestAccess.create({
      organizationId: "org-1",
      email: "a@example.com",
      guestRole: GuestRole.RECYCLER,
      grantedBy: "user-1",
    });

    const restored = guestAccessFromPlain(access.toPlain());

    expect(restored).toBeInstanceOf(DirectGuestAccess);
    expect(restored.toPlain()).toEqual(access.toPlain());
  });

  it("rejects an unknown or missing kind", () => {
    expect(() => guestAccessFromPlain({ kind: "Organization" })).toThrow(ValueError);
    expect(() => guestAccessFromPlain({})).toThrow(ValueError);
  });
});
