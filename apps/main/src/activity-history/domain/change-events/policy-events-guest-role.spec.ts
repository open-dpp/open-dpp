import { PermissionKind, Permissions } from "@open-dpp/dto";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { createAasObject } from "../../../aas/domain/security/aas-object";
import { Permission } from "../../../aas/domain/security/permission";
import { GuestRole } from "../../../identity/guest-access/domain/guest-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { PolicyAdded } from "./policy-added";
import { PolicyDeleted } from "./policy-deleted";
import { PolicyModified } from "./policy-modified";

describe("policy change events with a guest role", () => {
  const object = createAasObject(IdShortPath.create({ path: "section1" }));
  const read = Permission.create({
    permission: Permissions.Read,
    kindOfPermission: PermissionKind.Allow,
  });

  it("round-trips PolicyAdded, PolicyModified and PolicyDeleted", () => {
    const events = [
      PolicyAdded.create({
        userRole: UserRole.USER,
        guestRole: GuestRole.REPAIRER,
        object,
        value: [read],
      }),
      PolicyModified.create({
        userRole: UserRole.USER,
        guestRole: GuestRole.REPAIRER,
        object,
        oldValue: [read],
        newValue: [],
      }),
      PolicyDeleted.create({ userRole: UserRole.USER, guestRole: GuestRole.REPAIRER, object }),
    ];

    for (const event of events) {
      const plain = event.toPlain();
      expect(plain.guestRole).toEqual(GuestRole.REPAIRER);
      expect(plain.memberRole).toBeNull();
      expect((event.constructor as any).fromPlain(plain).toPlain()).toEqual(plain);
    }
  });

  it("serializes a missing guest role as null like the member role", () => {
    const plain = PolicyAdded.create({
      userRole: UserRole.ANONYMOUS,
      object,
      value: [read],
    }).toPlain();

    expect(plain.guestRole).toBeNull();
    expect(plain.memberRole).toBeNull();
  });

  it("reads events recorded before guest roles existed", () => {
    const oldPlain = {
      type: PolicyAdded.create({ userRole: UserRole.ANONYMOUS, object, value: [read] }).type,
      path: "section1",
      userRole: UserRole.ANONYMOUS,
      memberRole: null,
      value: [read.toPlain()],
    };

    const event = PolicyAdded.fromPlain(oldPlain) as PolicyAdded;

    expect(event.guestRole).toBeNull();
    expect(event.toPlain()).toEqual({ ...oldPlain, guestRole: null });
  });
});
