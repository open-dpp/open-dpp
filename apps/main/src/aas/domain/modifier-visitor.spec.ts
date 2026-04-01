import { beforeAll, expect } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef, KeyTypes, PermissionKind, Permissions, ReferenceTypes } from "@open-dpp/dto";
import { ForbiddenError } from "@open-dpp/exception";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { Permission } from "./security/permission";
import { Security } from "./security/security";
import { SubjectAttributes } from "./security/subject-attributes";
import { File } from "./submodel-base/file";
import { Property } from "./submodel-base/property";
import { ReferenceElement } from "./submodel-base/reference-element";
import { registerSubmodelElementClasses } from "./submodel-base/register-submodel-element-classes";
import { Submodel } from "./submodel-base/submodel";
import { IdShortPath } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";

describe("modifier visitor", () => {
  const existingDisplayNames = () => [LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" })];
  const existingDescriptions = () => [LanguageText.create({
    language: "en",
    text: "The Submodel Carbon Footprint OLD",
  })];

  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const newDisplayNames = [{
    language: "de",
    text: "CO2 Footprint New Text",
  }];
  const newDescriptions = [{
    language: "en",
    text: "The Submodel Carbon Footprint NEW",
  }, {
    language: "de",
    text: "Das Submodel liefert CO2",
  }];
  const sharedModifications = { displayName:
    newDisplayNames, description: newDescriptions };

  const prefixPermissionError = "Missing permissions to modify element";

  it("should modify submodel", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });

    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames(), description: existingDescriptions() });
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodel.idShort }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );

    const ability = security.defineAbilityForSubject(member);
    submodel.modify({ idShort: "s1", ...sharedModifications }, { ability });
    expect(submodel.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(submodel.description).toEqual(newDescriptions.map(LanguageText.fromPlain));

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() => submodel.modify({ idShort: "s1", ...sharedModifications }, { ability: abilityAnonymous })).toThrow(new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.`));
  });

  it.each([{
    type: AasSubmodelElements.Property,
    item: Property.create({ idShort: "prop1", displayName: existingDisplayNames(), description: existingDescriptions(), valueType: DataTypeDef.String }),
    modifications: { ...sharedModifications, value: "prop New" },
  }, {
    type: AasSubmodelElements.File,
    item: File.create({ idShort: "prop1", displayName: existingDisplayNames(), description: existingDescriptions(), contentType: "image/png" }),
    modifications: { ...sharedModifications, value: "path New", contentType: "image/jpeg" },
  }, {
    type: AasSubmodelElements.SubmodelElementCollection,
    item: SubmodelElementCollection.create({ idShort: "prop2", displayName: existingDisplayNames(), description: existingDescriptions() }),
    modifications: { ...sharedModifications, value: [] },
  }])("should modify submodel element with type $type", ({ item, modifications }) => {
    const security = Security.create({});
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames(), description: existingDescriptions() });
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });

    security.addPolicy(
      member,
      IdShortPath.create({ path: `${submodel.idShort}.${item.idShort}` }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );

    const ability = security.defineAbilityForSubject(member);
    submodel.addSubmodelElement(item);
    submodel.modifySubmodelElement({ idShort: item.idShort, ...modifications }, IdShortPath.create({ path: item.idShort }), { ability });
    expect(item.toPlain()).toMatchObject(
      {
        ...modifications,
      },
    );
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() => submodel.modifySubmodelElement({ idShort: item.idShort, ...modifications }, IdShortPath.create({ path: item.idShort }), { ability: abilityAnonymous })).toThrow(new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.${item.idShort}.`));
  });

  it("should modify submodel element list", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames(), description: existingDescriptions() });

    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });

    security.addPolicy(
      member,
      IdShortPath.create({ path: `${submodel.idShort}` }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );

    const listItem = SubmodelElementList.create({ idShort: "list", displayName: existingDisplayNames(), description: existingDescriptions(), typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const collection = SubmodelElementCollection.create({ idShort: "collection", displayName: existingDisplayNames(), description: existingDescriptions() });
    const property = Property.create({ idShort: "prop1", displayName: existingDisplayNames(), description: existingDescriptions(), valueType: DataTypeDef.String });
    collection.addSubmodelElement(property);
    listItem.addSubmodelElement(collection);
    submodel.addSubmodelElement(listItem);
    const modifications = {
      idShort: "list",
      displayName: newDisplayNames,
      description: newDescriptions,
      value: [{ idShort: "collection", displayName: newDisplayNames, value: [{ idShort: "prop1", value: "prop New" }] }],
    };
    const ability = security.defineAbilityForSubject(member);

    submodel.modifySubmodelElement(modifications, IdShortPath.create({ path: "list" }), { ability });
    expect(listItem.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(listItem.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    expect(collection.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(property.value).toEqual("prop New");
  });

  it("should modify reference element", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames(), description: existingDescriptions() });
    const referenceElement = ReferenceElement.create({
      idShort: "ref",
      displayName: existingDisplayNames(),
      description: existingDescriptions(),
      value: Reference.create({
        type: ReferenceTypes.ExternalReference,
        keys: [Key.create({ type: KeyTypes.GlobalReference, value: "https://example.com/ref/1234567890" })],
      }),
    });
    submodel.addSubmodelElement(referenceElement);
    const modifications = {
      idShort: "ref",
      displayName: newDisplayNames,
      description: newDescriptions,
      value: {
        type: ReferenceTypes.ModelReference,
        keys: [{ type: KeyTypes.AssetAdministrationShell, value: "https://example.com/aas/1234567890" }],
      },
    };
    const path = IdShortPath.create({ path: "ref" });

    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });

    security.addPolicy(
      member,
      IdShortPath.create({ path: `${submodel.idShort}` }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );

    const ability = security.defineAbilityForSubject(member);

    submodel.modifySubmodelElement(modifications, path, { ability });
    expect(referenceElement.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(referenceElement.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    expect(referenceElement.value?.type).toEqual(ReferenceTypes.ModelReference);
    expect(referenceElement.value?.keys[0].type).toEqual(KeyTypes.AssetAdministrationShell);
    expect(referenceElement.value?.keys[0].value).toEqual("https://example.com/aas/1234567890");
    submodel.modifySubmodelElement({
      idShort: "ref",
    }, path, { ability });
    expect(referenceElement.value?.type).toEqual(ReferenceTypes.ModelReference);
    expect(referenceElement.value?.keys[0].type).toEqual(KeyTypes.AssetAdministrationShell);
    expect(referenceElement.value?.keys[0].value).toEqual("https://example.com/aas/1234567890");
    submodel.modifySubmodelElement({
      idShort: "ref",
      value: null,
    }, path, { ability });
    expect(referenceElement.value).toBeNull();
  });
});
