import { expect } from "@jest/globals";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AssetKind } from "./asset-kind-enum";
import { AdministrativeInformation } from "./common/administrative-information";
import { Environment } from "./environment";

describe("environment", () => {
  it("should add empty aas", () => {
    const environment = Environment.create({ });
    const aas = environment.createAssetAdministrationShell(AssetKind.Type);
    expect(environment.assetAdministrationShells).toEqual([aas.id]);
    expect(aas).toEqual(AssetAdministrationShell.create({
      id: aas.id,
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Type,
        globalAssetId: aas.id,
      }),
    }));
  });
});
