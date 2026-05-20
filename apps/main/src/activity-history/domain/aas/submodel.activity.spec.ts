import { SubmodelActivity } from "./submodel.activity";
import { SubmodelOperationTypes } from "../../submodel-operation-types";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { Security } from "../../../aas/domain/security/security";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Permission } from "../../../aas/domain/security/permission";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";

describe("SubmodelActivity", () => {
  it("should return plain filtered by dppKey", () => {
    const digitalProductDocumentId = "digitalProductDocumentId";
    const userId = "userId";
    const submodelId = "submodelId";
    const oldData = {
      submodelElements: [
        { idShort: "prop1", value: "oldValue" },
        { idShort: "prop2", value: "oldValue" },
      ],
    };
    const newData = {
      submodelElements: [
        { idShort: "prop1", value: "newValue" },
        { idShort: "prop2", value: "newValue" },
      ],
    };
    const administration = AdministrativeInformation.create({ version: "1", revision: "0" });
    const fullIdShortPath = IdShortPath.create({ path: "section1.prop1" });

    const activity = SubmodelActivity.create({
      digitalProductDocumentId,
      administration,
      submodelId,
      fullIdShortPath,
      userId: userId,
      oldData,
      newData,
      operation: SubmodelOperationTypes.SubmodelElementModified,
    });

    expect(activity.toPlain({ filter: { dppKey: "prop1" } }).payload).toEqual({
      administration: administration.toPlain(),
      additionalIdShort: null,
      submodelId,
      fullIdShortPath: fullIdShortPath.toString(),
      changes: [
        {
          dpp: "prop1",
          op: "replace",
          path: "/submodelElements/0/value",
          value: "newValue",
        },
      ],
      operation: SubmodelOperationTypes.SubmodelElementModified,
    });

    expect(activity.toPlain({ filter: { dppKey: "sw:prop" } }).payload).toEqual({
      administration: administration.toPlain(),
      additionalIdShort: null,
      submodelId,
      fullIdShortPath: fullIdShortPath.toString(),
      changes: [
        {
          dpp: "prop2",
          op: "replace",
          path: "/submodelElements/1/value",
          value: "newValue",
        },
        {
          dpp: "prop1",
          op: "replace",
          path: "/submodelElements/0/value",
          value: "newValue",
        },
      ],
      operation: SubmodelOperationTypes.SubmodelElementModified,
    });
  });

  it("should return plain with different roles", () => {
    const digitalProductDocumentId = "digitalProductDocumentId";
    const userId = "userId";
    const submodelId = "submodelId";
    const oldData = { idShort: "prop1", value: "oldValue" };
    const newData = { idShort: "prop1", value: "newValue" };
    const administration = AdministrativeInformation.create({ version: "1", revision: "0" });
    const fullIdShortPath = IdShortPath.create({ path: "section1.prop1" });

    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const security = Security.create({});
    security.addPolicy(admin, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

    const activity = SubmodelActivity.create({
      digitalProductDocumentId,
      administration,
      submodelId,
      fullIdShortPath,
      userId: userId,
      oldData,
      newData,
      operation: SubmodelOperationTypes.SubmodelElementModified,
    });

    let ability = security.defineAbilityForSubject(admin, userId);

    expect(activity.toPlain({ ability }).payload).toEqual({
      administration: administration.toPlain(),
      additionalIdShort: null,
      submodelId,
      fullIdShortPath: fullIdShortPath.toString(),
      changes: [
        {
          dpp: "",
          op: "replace",
          path: "/value",
          value: "newValue",
        },
      ],
      operation: SubmodelOperationTypes.SubmodelElementModified,
    });

    ability = security.defineAbilityForSubject(member, userId);
    expect(activity.toPlain({ ability }).payload).toEqual({
      error: {
        status: 403,
        message: `Missing read permission to access activity payload for resource with idShort path ${fullIdShortPath.toString()}`,
      },
    });
  });
});
