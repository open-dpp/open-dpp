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
      guestRole: GuestRole.REPAIRER,
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
    expect(access.guestRole).toEqual(GuestRole.REPAIRER);
    expect(access.grantedBy).toEqual("user-1");
    expect(access.status).toEqual(GuestAccessStatus.PENDING);
    expect(access.acceptedByUserId).toBeUndefined();
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

  it("changes its role while it is not revoked", () => {
    const access = createPending();

    access.changeGuestRole(GuestRole.INDEPENDENT_OPERATOR);

    expect(access.guestRole).toEqual(GuestRole.INDEPENDENT_OPERATOR);
  });

  it("keeps its acceptance when the role changes", () => {
    const access = createPending();
    access.accept(invitee, later);

    access.changeGuestRole(GuestRole.SUPPLIER);

    expect(access.isActiveFor(callerFacts(invitee.id))).toBe(true);
  });

  it("cannot change its role after revocation", () => {
    const access = createPending();
    access.revoke(later);

    expect(() => access.changeGuestRole(GuestRole.SUPPLIER)).toThrow(ValueError);
  });

  it("round-trips through toPlain and fromPlain", () => {
    const access = createPending();
    access.accept(invitee, later);

    const restored = DirectGuestAccess.fromPlain(access.toPlain());

    expect(restored.toPlain()).toEqual(access.toPlain());
    expect(restored.isActiveFor(callerFacts(invitee.id))).toBe(true);
  });

  it("rejects a plain object without or with several roles", () => {
    const plain = createPending().toPlain();
    const { guestRole: _guestRole, ...withoutRole } = plain;

    expect(() => DirectGuestAccess.fromPlain(withoutRole)).toThrow();
    expect(() =>
      DirectGuestAccess.fromPlain({
        ...plain,
        guestRole: [GuestRole.REPAIRER, GuestRole.RECYCLER],
      }),
    ).toThrow();
  });
});
