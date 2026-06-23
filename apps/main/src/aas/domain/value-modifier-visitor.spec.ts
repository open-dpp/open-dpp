import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,
  PermissionKind,
  Permissions,
  ReferenceTypes,
} from "@open-dpp/dto";
import { ForbiddenError } from "@open-dpp/exception";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { IdShortPath } from "./common/id-short-path";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { Permission } from "./security/permission";
import { Security } from "./security/security";
import { SubjectAttributes } from "./security/subject-attributes";
import { File } from "./submodel-base/file";
import { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import { Property } from "./submodel-base/property";
import { ReferenceElement } from "./submodel-base/reference-element";
import { registerSubmodelElementClasses } from "./submodel-base/register-submodel-element-classes";
import { Submodel } from "./submodel-base/submodel";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { PropertyValueChanged } from "../../activity-history/domain/change-events/property-value-changed";
import { SubmodelElementAdded } from "../../activity-history/domain/change-events/submodel-element-added";
import { FileValueChanged } from "../../activity-history/domain/change-events/file-value-changed";
import { ReferenceElementValueChanged } from "../../activity-history/domain/change-events/reference-element-value-changed";

describe("value modifier visitor", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const existingDisplayNames = [
    LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" }),
  ];
  const prefixPermissionError = "Missing permissions to modify element";

  it("should modify value of property", () => {
    const submodel = Submodel.create({
      id: "s1",
      idShort: "s1",
      displayName: existingDisplayNames,
    });
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);

    const ability = security.defineAbilityForSubject(member);

    const property = Property.create({
      idShort: "prop1",
      displayName: existingDisplayNames,
      valueType: DataTypeDef.String,
      value: "old",
    });
    submodel.withTracking();
    submodel.addSubmodelElement(property, { ability });
    const modifications = "value new";
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "prop1" }), {
      ability,
    });
    expect(property.value).toEqual("value new");
    expect(property.value).toEqual("value new");
    const changes = submodel.tracker.stop();
    expect(changes).toEqual([
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "prop1"]),
        submodelElement: property,
      }),
      PropertyValueChanged.create({
        path: IdShortPath.create({ path: `${submodel.idShort}.prop1` }),
        newValue: "value new",
        oldValue: "old",
        valueType: DataTypeDef.String,
      }),
    ]);

    submodel.modifyValueOfSubmodelElement(null, IdShortPath.create({ path: "prop1" }), { ability });
    expect(property.value).toEqual(null);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() =>
      submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "prop1" }), {
        ability: abilityAnonymous,
      }),
    ).toThrow(new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.prop1.`));
  });

  it("should modify value of file", () => {
    const submodel = Submodel.create({
      id: "s1",
      idShort: "s1",
      displayName: existingDisplayNames,
    });
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const file = File.create({
      idShort: "file",
      displayName: existingDisplayNames,
      contentType: "image/png",
      value: "idToFile",
    });
    submodel.withTracking().addSubmodelElement(file, { ability });
    let modifications: any = { value: "value new", contentType: "image/jpeg" };

    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "file" }), {
      ability,
    });
    expect(file.value).toEqual("value new");
    expect(file.contentType).toEqual("image/jpeg");
    modifications = { value: null, contentType: undefined };
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "file" }), {
      ability,
    });
    expect(file.value).toBeNull();
    expect(file.contentType).toEqual("image/jpeg");
    const changes = submodel.tracker.stop();

    expect(changes).toEqual([
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "file"]),
        submodelElement: file,
      }),
      FileValueChanged.create({
        path: IdShortPath.create({ path: `${submodel.idShort}.file` }),
        newValue: { value: "value new", contentType: "image/jpeg" },
        oldValue: { contentType: "image/png", value: "idToFile" },
      }),
      FileValueChanged.create({
        path: IdShortPath.create({ path: `${submodel.idShort}.file` }),
        newValue: { value: null, contentType: "image/jpeg" },
        oldValue: { value: "value new", contentType: "image/jpeg" },
      }),
    ]);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() =>
      submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "file" }), {
        ability: abilityAnonymous,
      }),
    ).toThrow(new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.file.`));
  });

  it("should modify value of reference element", () => {
    const submodel = Submodel.create({
      id: "s1",
      idShort: "s1",
      displayName: existingDisplayNames,
    });
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const initialReference = Reference.create({
      type: ReferenceTypes.ExternalReference,
      keys: [
        Key.create({
          type: KeyTypes.GlobalReference,
          value: "https://example.com/ref/1234567890",
        }),
      ],
    });

    const oldValue = Reference.fromPlain(initialReference.toPlain());

    const referenceElement = ReferenceElement.create({
      idShort: "ref",
      displayName: existingDisplayNames,
      value: initialReference,
    });
    const path = IdShortPath.create({ path: "ref" });
    submodel.withTracking().addSubmodelElement(referenceElement, { ability });
    let modifications: any = {
      keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com/ref/other" }],
    };
    submodel.modifyValueOfSubmodelElement(modifications, path, { ability });

    const changes = submodel.tracker.stop();
    expect(changes).toEqual([
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "ref"]),
        submodelElement: referenceElement,
      }),
      ReferenceElementValueChanged.create({
        path: IdShortPath.create({ path: `${submodel.idShort}.ref` }),
        newValue: Reference.create({
          type: ReferenceTypes.ExternalReference,
          keys: [
            Key.create({
              type: KeyTypes.GlobalReference,
              value: "https://example.com/ref/other",
            }),
          ],
        }),
        oldValue,
      }),
    ]);

    modifications = {
      type: ReferenceTypes.ModelReference,
      keys: [{ type: KeyTypes.AssetAdministrationShell, value: "https://example.com/ref/other" }],
    };
    submodel.modifyValueOfSubmodelElement(modifications, path, { ability });
    // Undefined value should not change reference element value
    submodel.modifyValueOfSubmodelElement(undefined, path, { ability });
    expect(referenceElement.value?.type).toEqual(ReferenceTypes.ModelReference);
    expect(referenceElement.value?.keys[0].type).toEqual(KeyTypes.AssetAdministrationShell);
    expect(referenceElement.value?.keys[0].value).toEqual("https://example.com/ref/other");

    modifications = null;
    submodel.modifyValueOfSubmodelElement(modifications, path, { ability });
    expect(referenceElement.value).toBeNull();

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() =>
      submodel.modifyValueOfSubmodelElement(modifications, path, { ability: abilityAnonymous }),
    ).toThrow(new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.ref.`));
  });

  it("should modify value of submodel", () => {
    const submodel = Submodel.create({
      id: "s1",
      idShort: "s1",
      displayName: existingDisplayNames,
    });

    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const property = Property.create({
      idShort: "prop1",
      displayName: existingDisplayNames,
      value: "first",
      valueType: DataTypeDef.String,
    });
    submodel.withTracking().addSubmodelElement(property, { ability });

    const collection = SubmodelElementCollection.create({
      idShort: "collection",
      displayName: existingDisplayNames,
    });
    submodel.addSubmodelElement(collection, { ability });
    const property2 = Property.create({
      idShort: "prop2",
      displayName: existingDisplayNames,
      value: "first2",
      valueType: DataTypeDef.String,
    });
    submodel.addSubmodelElement(property2, {
      ability,
      idShortPath: IdShortPath.create({ path: collection.idShort }),
    });
    const modifications = { prop1: "second", collection: { prop2: "second2" } };
    submodel.modifyValue(modifications, {
      ability,
    });

    expect(property.value).toEqual("second");
    expect(property2.value).toEqual("second2");

    const changes = submodel.tracker.stop();
    expect(changes).toEqual([
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "prop1"]),
        submodelElement: property,
      }),
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "collection"]),
        submodelElement: collection,
      }),
      SubmodelElementAdded.create({
        path: IdShortPath.fromSegments([submodel.idShort, "collection", "prop2"]),
        submodelElement: property2,
      }),
      PropertyValueChanged.create({
        path: property.getIdShortPath(),
        oldValue: "first",
        newValue: "second",
        valueType: DataTypeDef.String,
      }),
      PropertyValueChanged.create({
        path: property2.getIdShortPath(),
        oldValue: "first2",
        newValue: "second2",
        valueType: DataTypeDef.String,
      }),
    ]);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() => submodel.modifyValue(modifications, { ability: abilityAnonymous })).toThrow(
      new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.prop1.`),
    );
  });

  it("should modify value of submodel element list", () => {
    const submodel = Submodel.create({
      id: "s1",
      idShort: "s1",
      displayName: existingDisplayNames,
    });

    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const listItem = SubmodelElementList.create({
      idShort: "list",
      displayName: existingDisplayNames,
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(listItem, { ability });

    const collection = SubmodelElementCollection.create({
      idShort: "collection",
      displayName: existingDisplayNames,
    });
    listItem.addSubmodelElement(collection, { ability });

    const property = Property.create({
      idShort: "prop1",
      displayName: existingDisplayNames,
      valueType: DataTypeDef.String,
    });
    const multiLanguageProperty = MultiLanguageProperty.create({
      idShort: "prop2",
      displayName: existingDisplayNames,
      value: [LanguageText.create({ language: "en", text: "english" })],
    });

    collection.addSubmodelElement(property, { ability });
    collection.addSubmodelElement(multiLanguageProperty, { ability });
    const modifications = [
      {
        prop1: "prop New",
        prop2: [{ de: "CO2 Footprint New Text" }],
      },
    ];
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "list" }), {
      ability,
    });
    expect(property.value).toEqual("prop New");
    expect(property.displayName).toEqual(existingDisplayNames.map(LanguageText.fromPlain));
    expect(multiLanguageProperty.value).toEqual([
      LanguageText.create({ language: "de", text: "CO2 Footprint New Text" }),
    ]);
    expect(multiLanguageProperty.displayName).toEqual(
      existingDisplayNames.map(LanguageText.fromPlain),
    );
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const abilityAnonymous = security.defineAbilityForSubject(anonymous);
    expect(() =>
      submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "list" }), {
        ability: abilityAnonymous,
      }),
    ).toThrow(
      new ForbiddenError(`${prefixPermissionError} ${submodel.idShort}.list.collection.prop1.`),
    );
  });
});
