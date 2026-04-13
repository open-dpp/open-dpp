import { AssetKind, DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { AssetInformation } from "../../domain/asset-information";
import { IdShortPath } from "../../domain/common/id-short-path";
import { Resource } from "../../domain/resource";
import { Permission } from "../../domain/security/permission";
import { Security } from "../../domain/security/security";
import { SubjectAttributes } from "../../domain/security/subject-attributes";
import { File } from "../../domain/submodel-base/file";
import { Property } from "../../domain/submodel-base/property";
import { Submodel } from "../../domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../../domain/submodel-base/submodel-element-collection";
import { extractMediaIds } from "./extract-media-ids";

describe("extractMediaIds", () => {
  it("should return empty array when no shells and no submodels", () => {
    expect(extractMediaIds([], [])).toEqual([]);
  });

  it("should extract media IDs from defaultThumbnails", () => {
    const shell = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Instance,
        defaultThumbnails: [
          Resource.create({ path: "media-id-1", contentType: "image/webp" }),
          Resource.create({ path: "media-id-2", contentType: "image/png" }),
        ],
      }),
    });

    const result = extractMediaIds([shell], []);
    expect(result).toEqual(expect.arrayContaining(["media-id-1", "media-id-2"]));
    expect(result).toHaveLength(2);
  });

  it("should extract media IDs from File submodel elements", () => {
    const file = File.create({
      idShort: "productImage",
      contentType: "image/webp",
      value: "file-media-id-1",
    });
    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [file] });

    const result = extractMediaIds([], [submodel]);
    expect(result).toEqual(["file-media-id-1"]);
  });

  it("should extract media IDs from nested File elements inside SubmodelElementCollection", () => {
    const file = File.create({
      idShort: "nestedFile",
      contentType: "image/webp",
      value: "nested-media-id",
    });
    const collection = SubmodelElementCollection.create({ idShort: "collection" });
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });

    security.addPolicy(
      member,
      IdShortPath.create({ path: collection.idShort }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      ],
    );
    const ability = security.defineAbilityForSubject(member);
    collection.addSubmodelElement(file, { ability });

    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [collection] });

    const result = extractMediaIds([], [submodel]);
    expect(result).toEqual(["nested-media-id"]);
  });

  it("should skip File elements with null value", () => {
    const file = File.create({
      idShort: "emptyFile",
      contentType: "image/webp",
    });
    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [file] });

    const result = extractMediaIds([], [submodel]);
    expect(result).toEqual([]);
  });

  it("should skip non-File submodel elements", () => {
    const property = Property.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
      value: "some-value",
    });
    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [property] });

    const result = extractMediaIds([], [submodel]);
    expect(result).toEqual([]);
  });

  it("should deduplicate media IDs", () => {
    const shell = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Instance,
        defaultThumbnails: [Resource.create({ path: "shared-id", contentType: "image/webp" })],
      }),
    });

    const file = File.create({
      idShort: "file1",
      contentType: "image/webp",
      value: "shared-id",
    });
    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [file] });

    const result = extractMediaIds([shell], [submodel]);
    expect(result).toEqual(["shared-id"]);
  });

  it("should combine media IDs from both shells and submodels", () => {
    const shell = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Instance,
        defaultThumbnails: [Resource.create({ path: "thumbnail-id", contentType: "image/webp" })],
      }),
    });

    const file = File.create({
      idShort: "file1",
      contentType: "application/pdf",
      value: "file-id",
    });
    const submodel = Submodel.create({ idShort: "sm1", submodelElements: [file] });

    const result = extractMediaIds([shell], [submodel]);
    expect(result).toEqual(expect.arrayContaining(["thumbnail-id", "file-id"]));
    expect(result).toHaveLength(2);
  });
});
