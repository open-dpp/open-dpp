import { randomUUID } from "node:crypto";
import { AssetKind, KeyTypes, Language, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { allPermissionsAllow } from "@open-dpp/testing";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { Resource } from "./resource";
import { createAasObject } from "./security/aas-object";
import { AccessPermissionRule } from "./security/access-permission-rule";
import { Permission } from "./security/permission";
import { PermissionPerObject } from "./security/permission-per-object";
import { Security } from "./security/security";
import { SubjectAttributes } from "./security/subject-attributes";
import { Submodel } from "./submodel-base/submodel";
import { IdShortPath } from "./submodel-base/submodel-base";

describe("assetAdministrationShell", () => {
  it("should create a new asset administration shell", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
    });
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
    expect(aas.administration).toEqual(AdministrativeInformation.create({ version: "1", revision: "0" }));
    expect(aas.security).toEqual(Security.create({}));
  });

  it("fails to create a new asset administration shell cause of duplicates in language texts", () => {
    const expectedError = new ValueError("All language texts must have unique languages");
    const languageWithDuplicates = [
      LanguageText.create({ language: Language.en, text: "Test AAS" }),
      LanguageText.create({ language: Language.en, text: "Test other AAS" }),
    ];
    expect(() => AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
      displayName: languageWithDuplicates,
    })).toThrow(expectedError);

    expect(() => AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
      description: languageWithDuplicates,
    })).toThrow(expectedError);
  });

  it("should delete submodel", () => {
    const submodelId1 = "submodelId1";
    const submodelToDelete = Submodel.create({ id: submodelId1, idShort: "subD" });

    const submodelRef1 = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId1 })],
    });
    const submodelId2 = "submodelId2";
    const submodelRef2 = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId2 })],
    });

    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
      submodels: [submodelRef1, submodelRef2],
    });
    aas.deleteSubmodel(submodelToDelete);
    expect(aas.submodels).toEqual([submodelRef2]);
  });

  it("should be modified", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance, globalAssetId: "globalAssetId" }),
    });
    const displayName = [{ language: "en", text: "MyAAS" }];
    const description = [{ language: "en", text: "My description" }];
    const defaultThumbnails = [{ path: "path.to.image", contentType: "image/jepg" }];
    aas.modify({ displayName, description, assetInformation: { defaultThumbnails } });
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
    expect(aas.assetInformation.globalAssetId).toEqual("globalAssetId");
    expect(aas.assetInformation.defaultThumbnails).toEqual(defaultThumbnails.map(Resource.fromPlain));
  });

  it("should be able to be copied", () => {
    const id = "aasId";
    const aas = AssetAdministrationShell.create({
      id,
      assetInformation: AssetInformation.create({ assetKind: "Instance", globalAssetId: id }),
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "MySubmodel",
    });

    aas.addSubmodel(submodel);

    const submodelCopy = submodel.copy();

    const copy = aas.copy([submodelCopy]);

    expect(copy.id).not.toEqual(aas.id);
    expect(copy.assetInformation).toEqual({ ...aas.assetInformation, globalAssetId: copy.id });
    expect(copy.submodels).toEqual([
      Reference.create({
        type: ReferenceTypes.ModelReference,
        keys: [Key.create({
          type: KeyTypes.Submodel,
          value: submodelCopy.id,
        })],
      }),
    ]);
  });

  it("should add a submodel", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: "Instance" }),
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "MySubmodel",
    });

    aas.addSubmodel(submodel);

    expect(aas.submodels).toEqual([Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({
        type: KeyTypes.Submodel,
        value: submodel.id,
      })],
    })]);
    expect(aas.security.localAccessControl.accessPermissionRules).toEqual([
      AccessPermissionRule.create({
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        permissionsPerObject: [PermissionPerObject.create({
          object: createAasObject(IdShortPath.create({ path: submodel.idShort })),
          permissions: allPermissionsAllow.map(Permission.fromPlain),
        })],
      }),
      AccessPermissionRule.create({
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
        permissionsPerObject: [PermissionPerObject.create({
          object: createAasObject(IdShortPath.create({ path: submodel.idShort })),
          permissions: allPermissionsAllow.map(Permission.fromPlain),
        })],
      }),
    ]);
  });
});
