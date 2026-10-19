import { expect } from "@jest/globals";
import { AssetKind, PermissionKind, Permissions, PermissionType } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { IdShortPath } from "./common/id-short-path";
import { LanguageText } from "./common/language-text";
import { Environment } from "./environment";
import { Permission } from "./security/permission";
import { Security } from "./security/security";
import { SubjectAttributes } from "./security/subject-attributes";
import { Submodel } from "./submodel-base/submodel";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";

describe("environment", () => {
  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });
  const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

  function abilityWithPermissions(idShorts: string[], permissions: Array<PermissionType>) {
    const security = Security.create({});
    for (const idShort of idShorts) {
      security.addPolicy(
        member,
        IdShortPath.create({ path: idShort }),
        permissions.map((permission) =>
          Permission.create({ permission, kindOfPermission: PermissionKind.Allow }),
        ),
      );
    }
    return security.defineAbilityForSubject(member);
  }

  it("should add aas", () => {
    const environment = Environment.create({});
    const displayName = [LanguageText.create({ language: "en", text: "Test AAS" })];
    const description = [LanguageText.create({ language: "en", text: "Test AAS description" })];

    const aas = environment.addAssetAdministrationShell(
      AssetAdministrationShell.create({
        assetInformation: AssetInformation.create({ assetKind: AssetKind.Type }),
        displayName,
        description,
      }),
    );
    expect(environment.assetAdministrationShells).toEqual([aas.id]);
    expect(aas).toEqual(
      AssetAdministrationShell.create({
        id: aas.id,
        administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
        assetInformation: AssetInformation.create({
          assetKind: AssetKind.Type,
        }),
        displayName,
        description,
      }),
    );
  });

  it("should add empty submodel", () => {
    const environment = Environment.create({});
    const id = "sub1";
    const newSubmodel = Submodel.create({ id, idShort: id });
    const submodel = environment.addSubmodel(newSubmodel);
    expect(environment.submodels).toEqual([submodel.id]);
    expect(submodel).toEqual(newSubmodel);
    expect(() => environment.addSubmodel(newSubmodel)).toThrow(
      new ValueError(`Submodel with id sub1 already exists`),
    );
  });

  it("should delete submodel", () => {
    const environment = Environment.create({});
    const id = "sub1";
    const submodelToDelete = Submodel.create({ id, idShort: id });
    const otherSubmodel = Submodel.create({ id: "sub2", idShort: "sub2" });
    environment.addSubmodel(submodelToDelete);
    environment.addSubmodel(otherSubmodel);
    expect(environment.submodels).toEqual([submodelToDelete.id, otherSubmodel.id]);

    const ability = abilityWithPermissions(["sub1"], [Permissions.Read, Permissions.Delete]);
    environment.deleteSubmodel(submodelToDelete, ability);
    expect(environment.submodels).toEqual([otherSubmodel.id]);
  });

  it("should reject deleting a submodel without permission", () => {
    const environment = Environment.create({});
    const submodel = Submodel.create({ id: "sub1", idShort: "sub1" });
    environment.addSubmodel(submodel);

    const anonymousAbility = Security.create({}).defineAbilityForSubject(anonymous);
    expect(() => environment.deleteSubmodel(submodel, anonymousAbility)).toThrow(ForbiddenError);
    expect(environment.submodels).toEqual([submodel.id]);
  });

  it("should move submodel to front, back and middle", () => {
    const environment = Environment.create({});
    const sub1 = Submodel.create({ id: "sub1", idShort: "sub1" });
    const sub2 = Submodel.create({ id: "sub2", idShort: "sub2" });
    const sub3 = Submodel.create({ id: "sub3", idShort: "sub3" });
    environment.addSubmodel(sub1);
    environment.addSubmodel(sub2);
    environment.addSubmodel(sub3);
    expect(environment.submodels).toEqual(["sub1", "sub2", "sub3"]);

    const ability = abilityWithPermissions(
      ["sub1", "sub2", "sub3"],
      [Permissions.Read, Permissions.Edit],
    );

    environment.moveSubmodel(sub3, 0, ability);
    expect(environment.submodels).toEqual(["sub3", "sub1", "sub2"]);

    environment.moveSubmodel(sub3, 2, ability);
    expect(environment.submodels).toEqual(["sub1", "sub2", "sub3"]);

    environment.moveSubmodel(sub1, 1, ability);
    expect(environment.submodels).toEqual(["sub2", "sub1", "sub3"]);
  });

  it("should throw when moving an unknown submodel", () => {
    const environment = Environment.create({});
    environment.addSubmodel(Submodel.create({ id: "sub1", idShort: "sub1" }));
    const unknown = Submodel.create({ id: "unknown", idShort: "unknown" });
    const ability = abilityWithPermissions(["unknown"], [Permissions.Read, Permissions.Edit]);
    expect(() => environment.moveSubmodel(unknown, 0, ability)).toThrow(
      new ValueError(`Submodel with id unknown does not exist`),
    );
  });

  it("should reject moving a submodel without permission", () => {
    const environment = Environment.create({});
    const submodel = Submodel.create({ id: "sub1", idShort: "sub1" });
    environment.addSubmodel(submodel);

    const anonymousAbility = Security.create({}).defineAbilityForSubject(anonymous);
    expect(() => environment.moveSubmodel(submodel, 0, anonymousAbility)).toThrow(ForbiddenError);
    expect(environment.submodels).toEqual([submodel.id]);
  });

  it("should track a SubmodelMoved change-event, noop when position is unchanged", () => {
    const environment = Environment.create({});
    const sub1 = Submodel.create({ id: "sub1", idShort: "sub1" });
    const sub2 = Submodel.create({ id: "sub2", idShort: "sub2" });
    environment.addSubmodel(sub1);
    environment.addSubmodel(sub2);
    environment.withTracking();

    const ability = abilityWithPermissions(["sub1", "sub2"], [Permissions.Read, Permissions.Edit]);

    environment.moveSubmodel(sub2, 0, ability);
    const [moveEvent] = environment.tracker.stop();
    expect(moveEvent.isNoop()).toBe(false);
    expect(moveEvent.toPlain()).toMatchObject({
      submodelId: "sub2",
      oldPosition: 1,
      position: 0,
    });

    environment.withTracking();
    environment.moveSubmodel(sub2, 0, ability);
    const changesAfterNoopMove = environment.tracker.stop();
    expect(changesAfterNoopMove).toHaveLength(0);
  });
});
