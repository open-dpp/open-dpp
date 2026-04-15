import { expect } from "@jest/globals";
import { DataTypeDef, PermissionKind, Permissions, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { Reference } from "../common/reference";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";

import { RelationshipElement } from "./relationship-element";

describe("relationshipElement", () => {
  it("should add submodel element", () => {
    const relationshipElement = RelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const submodelElement = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    expect(() => relationshipElement.addSubmodelElement(submodelElement)).toThrow(
      new ValueError("RelationshipElement cannot contain submodel elements"),
    );
  });

  it("should get submodel element", () => {
    const relationshipElement = RelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    expect(relationshipElement.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const relationshipElement = RelationshipElement.create({
      idShort: "prop1",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    let ability = security.defineAbilityForSubject(member);
    expect(relationshipElement.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      first: { type: ReferenceTypes.ExternalReference, keys: [] },
      second: { type: ReferenceTypes.ExternalReference, keys: [] },
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(relationshipElement.toPlain({ ability })).toEqual({});
  });
});
