import { expect } from "@jest/globals";
import { AssetKind } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { LanguageText } from "./common/language-text";
import { Environment } from "./environment";
import { Submodel } from "./submodel-base/submodel";

describe("environment", () => {
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
    environment.deleteSubmodel(submodelToDelete);
    expect(environment.submodels).toEqual([otherSubmodel.id]);
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

    environment.moveSubmodel("sub3", 0);
    expect(environment.submodels).toEqual(["sub3", "sub1", "sub2"]);

    environment.moveSubmodel("sub3", 2);
    expect(environment.submodels).toEqual(["sub1", "sub2", "sub3"]);

    environment.moveSubmodel("sub1", 1);
    expect(environment.submodels).toEqual(["sub2", "sub1", "sub3"]);
  });

  it("should throw when moving an unknown submodel", () => {
    const environment = Environment.create({});
    environment.addSubmodel(Submodel.create({ id: "sub1", idShort: "sub1" }));
    expect(() => environment.moveSubmodel("unknown", 0)).toThrow(
      new ValueError(`Submodel with id unknown does not exist`),
    );
  });

  it("should track a SubmodelMoved change-event, noop when position is unchanged", () => {
    const environment = Environment.create({});
    environment.addSubmodel(Submodel.create({ id: "sub1", idShort: "sub1" }));
    environment.addSubmodel(Submodel.create({ id: "sub2", idShort: "sub2" }));
    environment.withTracking();

    environment.moveSubmodel("sub2", 0);
    const [moveEvent] = environment.tracker.stop();
    expect(moveEvent.isNoop()).toBe(false);
    expect(moveEvent.toPlain()).toMatchObject({
      submodelId: "sub2",
      oldPosition: 1,
      position: 0,
    });

    environment.withTracking();
    environment.moveSubmodel("sub2", 0);
    const changesAfterNoopMove = environment.tracker.stop();
    expect(changesAfterNoopMove).toHaveLength(0);
  });
});
