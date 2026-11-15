import { describe, expect, it } from "vitest";
import { User } from "../../../users/domain/user";
import { DirectGuestAccess } from "../../domain/direct-guest-access";
import { GuestRole } from "../../domain/guest-role.enum";
import { GuestAccessMapper } from "./guest-access.mapper";

describe("GuestAccessMapper", () => {
  function createPending() {
    return DirectGuestAccess.create({
      organizationId: "org-1",
      email: "repairer@example.com",
      guestRole: GuestRole.REPAIRER,
      grantedBy: "user-1",
    });
  }

  it("maps the id to _id", () => {
    const access = createPending();

    const persistence = GuestAccessMapper.toPersistence(access);

    expect(persistence).toEqual({
      _id: access.id,
      kind: "Direct",
      organizationId: "org-1",
      email: "repairer@example.com",
      guestRole: GuestRole.REPAIRER,
      grantedBy: "user-1",
      createdAt: access.createdAt,
      revision: undefined,
    });
  });

  it("reads the stored revision, and 0 for an access stored without one", () => {
    const { _id, ...rest } = GuestAccessMapper.toPersistence(createPending());

    expect(GuestAccessMapper.toDomain({ _id, ...rest, revision: 3 }).revision).toBe(3);
    expect(GuestAccessMapper.toDomain({ _id, ...rest }).revision).toBe(0);
  });

  it("round-trips an accepted and revoked access through persistence", () => {
    const access = createPending();
    access.accept(
      User.create({
        email: "repairer@example.com",
        firstName: "Rita",
        lastName: "Repair",
        emailVerified: true,
      }),
      new Date("2026-10-16T10:00:00.000Z"),
    );
    access.revoke(new Date("2026-10-17T10:00:00.000Z"));

    const restored = GuestAccessMapper.toDomain(GuestAccessMapper.toPersistence(access));

    expect(restored).toBeInstanceOf(DirectGuestAccess);
    expect(restored.toPlain()).toEqual({ ...access.toPlain(), revision: 0 });
  });
});
