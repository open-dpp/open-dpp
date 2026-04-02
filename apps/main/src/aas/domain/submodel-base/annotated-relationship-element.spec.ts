import { expect } from "@jest/globals";
import { DataTypeDef, KeyTypes, PermissionKind, Permissions, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Key } from "../common/key";
import { Reference } from "../common/reference";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { AnnotatedRelationshipElement } from "./annotated-relationship-element";
import { Property } from "./property";
import { IdShortPath } from "./submodel-base";

describe("annotatedRelationshipElement", () => {
  it("should add submodel element", () => {
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const submodelElement = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement);
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement]);
    expect(() => annotatedRelationshipElement.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      "Submodel element with idShort prop1 already exists",
    ));
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const first = Reference.create(
      { type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "urn:uuid:first" })],
      },
    );
    const second = Reference.create(
      { type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "urn:uuid:second" })],
      },
    );
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({ idShort: "prop1", first, second });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);
    expect(annotatedRelationshipElement.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      first: { type: ReferenceTypes.ExternalReference, keys: [{ type: KeyTypes.GlobalReference, value: "urn:uuid:first" }] },
      second: { type: ReferenceTypes.ExternalReference, keys: [{ type: KeyTypes.GlobalReference, value: "urn:uuid:second" }] },
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(annotatedRelationshipElement.toPlain({ ability })).toEqual({});
  });

  it("should delete submodel element", () => {
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(member, IdShortPath.create({ path: "idShort" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const submodelElement0 = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement0);
    const submodelElement1 = Property.create({ idShort: "prop2", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement1);
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement0, submodelElement1]);
    annotatedRelationshipElement.deleteSubmodelElement(submodelElement0.idShort, { ability });
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement1]);
    expect(() => annotatedRelationshipElement.deleteSubmodelElement("unknown", { ability })).toThrow(ValueError);
  });
});
