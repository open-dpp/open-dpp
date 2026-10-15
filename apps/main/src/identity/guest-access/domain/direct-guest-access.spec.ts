import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { User } from "../../users/domain/user";
import { DirectGuestAccess } from "./direct-guest-access";
import { GuestAccessStatus } from "./guest-access-kind.enum";
import { GuestRole } from "./guest-role.enum";

describe("directGuestAccess", () => {
  const now = new Date("2026-10-15T10:00:00.000Z");
  const later = new Date("2026-10-16T10:00:00.000Z");
  function createUser(data: { email?: string; emailVerified?: boolean } = {}) {
    return User.create({
      email: data.email ?? "repairer@example.com",
      firstName: "Rita",
      lastName: "Repair",
      emailVerified: data.emailVerified ?? true,
    });
  }

  const invitee = createUser();

  function createPending() {
    return DirectGuestAccess.create({
      organizationId: "org-1",
      email: " Repairer@Example.com ",
      guestRoles: [GuestRole.REPAIRER],
      grantedBy: "user-1",
      now,
    });
  }

  function callerFacts(userId: string) {
    return { userId };
  }

  it("creates a pending access with a normalized email", () => {
    const access = createPending();

    expect(access.id).toBeDefined();
    expect(access.kind).toEqual("Direct");
    expect(access.email).toEqual("repairer@example.com");
    expect(access.guestRoles).toEqual([GuestRole.REPAIRER]);
    expect(access.grantedBy).toEqual("user-1");
    expect(access.status).toEqual(GuestAccessStatus.PENDING);
    expect(access.acceptedByUserId).toBeUndefined();
  });

  it("rejects creation without roles and removes duplicate roles", () => {
    expect(() =>
      DirectGuestAccess.create({
        organizationId: "org-1",
        email: "a@example.com",
        guestRoles: [],
        grantedBy: "user-1",
      }),
    ).toThrow(ValueError);

    const access = DirectGuestAccess.create({
      organizationId: "org-1",
      email: "a@example.com",
      guestRoles: [GuestRole.SUPPLIER, GuestRole.SUPPLIER],
      grantedBy: "user-1",
    });
    expect(access.guestRoles).toEqual([GuestRole.SUPPLIER]);
  });

  it("grants nothing while pending", () => {
    const access = createPending();

    expect(access.isActiveFor(callerFacts(invitee.id))).toBe(false);
  });

  it("is bound to the accepting user once accepted", () => {
    const access = createPending();

    access.accept(invitee, later);

    expect(access.status).toEqual(GuestAccessStatus.ACCEPTED);
    expect(access.acceptedByUserId).toEqual(invitee.id);
    expect(access.acceptedAt).toEqual(later);
    expect(access.isActiveFor(callerFacts(invitee.id))).toBe(true);
    expect(access.isActiveFor(callerFacts("user-3"))).toBe(false);
  });

  it("accepts with a differently cased invited email", () => {
    const access = createPending();

    access.accept(createUser({ email: "REPAIRER@example.com" }), later);

    expect(access.status).toEqual(GuestAccessStatus.ACCEPTED);
  });

  it("rejects acceptance with another or an unverified email", () => {
    const access = createPending();

    expect(() => access.accept(createUser({ email: "other@example.com" }), later)).toThrow(
      ValueError,
    );
    expect(() => access.accept(createUser({ emailVerified: false }), later)).toThrow(ValueError);
    expect(access.status).toEqual(GuestAccessStatus.PENDING);
  });

  it("cannot be accepted twice or after revocation", () => {
    const accepted = createPending();
    accepted.accept(invitee, later);
    expect(() => accepted.accept(createUser(), later)).toThrow(ValueError);

    const revoked = createPending();
    revoked.revoke(later);
    expect(() => revoked.accept(invitee, later)).toThrow(ValueError);
  });

  it("is inactive after revocation and keeps the first revocation date", () => {
    const access = createPending();
    access.accept(invitee, later);

    access.revoke(later);
    access.revoke(new Date("2026-10-20T10:00:00.000Z"));

    expect(access.status).toEqual(GuestAccessStatus.REVOKED);
    expect(access.revokedAt).toEqual(later);
    expect(access.isActiveFor(callerFacts(invitee.id))).toBe(false);
  });

  it("adds and removes roles but keeps at least one", () => {
    const access = createPending();

    access.addGuestRole(GuestRole.INDEPENDENT_OPERATOR);
    access.addGuestRole(GuestRole.INDEPENDENT_OPERATOR);
    expect(access.guestRoles).toEqual([GuestRole.REPAIRER, GuestRole.INDEPENDENT_OPERATOR]);

    access.removeGuestRole(GuestRole.REPAIRER);
    expect(access.guestRoles).toEqual([GuestRole.INDEPENDENT_OPERATOR]);

    expect(() => access.removeGuestRole(GuestRole.INDEPENDENT_OPERATOR)).toThrow(ValueError);
  });

  it("cannot change roles after revocation", () => {
    const access = createPending();
    access.revoke(later);

    expect(() => access.addGuestRole(GuestRole.SUPPLIER)).toThrow(ValueError);
    expect(() => access.removeGuestRole(GuestRole.REPAIRER)).toThrow(ValueError);
  });

  it("does not expose its internal roles array", () => {
    const access = createPending();

    access.guestRoles.push(GuestRole.SUPPLIER);

    expect(access.guestRoles).toEqual([GuestRole.REPAIRER]);
  });

  it("round-trips through toPlain and fromPlain", () => {
    const access = createPending();
    access.accept(invitee, later);

    const restored = DirectGuestAccess.fromPlain(access.toPlain());

    expect(restored.toPlain()).toEqual(access.toPlain());
    expect(restored.isActiveFor(callerFacts(invitee.id))).toBe(true);
  });

  it("rejects a plain object without roles", () => {
    expect(() =>
      DirectGuestAccess.fromPlain({ ...createPending().toPlain(), guestRoles: [] }),
    ).toThrow(ValueError);
  });
});
