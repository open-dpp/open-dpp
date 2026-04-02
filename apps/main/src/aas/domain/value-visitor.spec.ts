import { Buffer } from "node:buffer";
import { expect } from "@jest/globals";
import {
  DataTypeDef,
  EntityType,
  KeyTypes,
  Language,
  PermissionKind,
  Permissions,
  ReferenceTypes,
} from "@open-dpp/dto";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { IdShortPath } from "./common/id-short-path";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { Permission } from "./security/permission";
import { Security } from "./security/security";
import { SubjectAttributes } from "./security/subject-attributes";
import { AnnotatedRelationshipElement } from "./submodel-base/annotated-relationship-element";
import { Blob } from "./submodel-base/blob";
import { Entity } from "./submodel-base/entity";
import { File } from "./submodel-base/file";
import { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import { Property } from "./submodel-base/property";
import { Range } from "./submodel-base/range";
import { ReferenceElement } from "./submodel-base/reference-element";
import { RelationshipElement } from "./submodel-base/relationship-element";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { ValueVisitor } from "./value-visitor";

describe("value-visitor", () => {
  it("should return value representation of property", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const property = Property.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
      value: "blub1",
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitProperty(property)).toEqual("blub1");

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitProperty(property)).toEqual(undefined);
  });

  it("should return value representation of multilanguage property", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const enValue = { language: Language.en, text: "blub1" };
    const multiLanguageProperty = MultiLanguageProperty.create({
      idShort: "prop1",
      value: [LanguageText.create(enValue)],
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitMultiLanguageProperty(multiLanguageProperty)).toEqual([{
      [enValue.language]: enValue.text,
    }]);

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitMultiLanguageProperty(multiLanguageProperty)).toEqual(undefined);
  });

  it("should return value representation of reference element", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const referenceElement = ReferenceElement.create({
      idShort: "prop1",
      value: Reference.create({
        type: ReferenceTypes.ExternalReference,
        keys: [Key.create({ type: KeyTypes.GlobalReference, value: "http://example.com" })],
      }),
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitReferenceElement(referenceElement)).toEqual({
      type: ReferenceTypes.ExternalReference,
      keys: [
        { type: KeyTypes.GlobalReference, value: "http://example.com" },
      ],
    });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitReferenceElement(referenceElement)).toEqual(undefined);
  });

  it("should return value representation of range", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const range = Range.create({
      idShort: "prop1",
      valueType: DataTypeDef.Int,
      min: "2",
      max: "10",
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitRange(range)).toEqual({
      min: "2",
      max: "10",
    });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitRange(range)).toEqual(undefined);
  });

  it("should return value representation of file", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const file = File.create({
      idShort: "prop1",
      contentType: "image/png",
      value: "blub1",
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitFile(file)).toEqual({ contentType: "image/png", value: "blub1" });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitFile(file)).toEqual(undefined);
  });

  it("should return value representation of blob", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const blob = Blob.create({
      idShort: "prop1",
      contentType: "image/png",
      value: Buffer.from("hello"),
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitBlob(blob)).toEqual({ contentType: "image/png", value: "hello" });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitBlob(blob)).toEqual(undefined);
  });

  it("should return value representation of relationship element", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const reference1 = Reference.create({ type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "http://first" })] });
    const reference2 = Reference.create({ type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "http://second" })] });
    const relationshipElement = RelationshipElement.create({
      idShort: "prop1",
      first: reference1,
      second: reference2,
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitRelationshipElement(relationshipElement)).toEqual({ first: visitor.visitReference(reference1), second: visitor.visitReference(reference2) });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitRelationshipElement(relationshipElement)).toEqual(undefined);
  });

  it("should return value representation of annotated relationship element", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const reference1 = Reference.create({ type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "http://first" })] });
    const reference2 = Reference.create({ type: ReferenceTypes.ExternalReference, keys: [Key.create({ type: KeyTypes.GlobalReference, value: "http://second" })] });
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({
      idShort: "prop1",
      first: reference1,
      second: reference2,
      annotations: [Property.create({ idShort: "ann1", value: "val", valueType: DataTypeDef.String })],
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitAnnotatedRelationshipElement(annotatedRelationshipElement)).toEqual(
      { first: visitor.visitReference(reference1), second: visitor.visitReference(reference2) },
    );

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitAnnotatedRelationshipElement(annotatedRelationshipElement)).toEqual(undefined);
  });

  it("should return value representation of submodel element collection", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop2" }), []);
    security.addPolicy(
      member,
      IdShortPath.create({ path: "subSection1" }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow })],
    );

    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "subSection1",
    });
    const property1 = Property.create({ idShort: "prop1", valueType: DataTypeDef.String, value: "blub1" });
    const property2 = Property.create({ idShort: "prop2", valueType: DataTypeDef.String, value: "blub2" });
    const ability = security.defineAbilityForSubject(member);

    submodelElementCollection.addSubmodelElement(property1, { ability });
    submodelElementCollection.addSubmodelElement(property2, { ability });

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitSubmodelElementCollection(submodelElementCollection)).toEqual({ prop1: "blub1" });

    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability: anonymousAbility });
    expect(visitor.visitSubmodelElementCollection(submodelElementCollection)).toEqual(undefined);
  });

  it("should return value representation of submodel element list", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    security.addPolicy(member, IdShortPath.create({ path: "subSection1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.row1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.row1.prop2" }), []);

    let ability = security.defineAbilityForSubject(member);

    const submodelElementList = SubmodelElementList.create({
      idShort: "subSection1",
      typeValueListElement: KeyTypes.SubmodelElementCollection,
    });
    const row = SubmodelElementCollection.create({ idShort: "row1" });
    submodelElementList.addSubmodelElement(row, { ability });

    const property1 = Property.create({ idShort: "prop1", valueType: DataTypeDef.String, value: "blub1" });
    const property2 = Property.create({ idShort: "prop2", valueType: DataTypeDef.String, value: "blub2" });
    row.addSubmodelElement(property1, { ability });
    row.addSubmodelElement(property2, { ability });

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitSubmodelElementList(submodelElementList)).toEqual([{ prop1: "blub1" }]);

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitSubmodelElementList(submodelElementList)).toEqual([]);
  });

  it("should return value representation of entity", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    security.addPolicy(
      member,
      IdShortPath.create({ path: "entity" }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      ],
    );
    security.addPolicy(member, IdShortPath.create({ path: "entity.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);

    const entity = Entity.create({
      idShort: "entity",
      entityType: EntityType.SelfManagedEntity,
    });
    entity.addSubmodelElement(Property.create({ idShort: "prop1", valueType: DataTypeDef.String, value: "blub1" }), { ability });

    let visitor = new ValueVisitor({ ability });
    expect(visitor.visitEntity(entity)).toEqual({ entityType: EntityType.SelfManagedEntity, globalAssetId: null, statements: [{ prop1: "blub1" }], specificAssetIds: [] });

    ability = security.defineAbilityForSubject(anonymous);
    visitor = new ValueVisitor({ ability });
    expect(visitor.visitEntity(entity)).toEqual(undefined);
  });
});
