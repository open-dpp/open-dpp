import { randomUUID } from "node:crypto";
import { beforeAll } from "@jest/globals";
import { submodelCarbonFootprintPlainFactory } from "../../fixtures/submodel.factory";
import { registerSubmodelClasses } from "./register-submodel-classes";
import { IdShortPath, Submodel } from "./submodel";

describe("submodel", () => {
  beforeAll(() => {
    registerSubmodelClasses();
  });
  it("should find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    let element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }));
    expect(element?.idShort).toBe("ProductCarbonFootprint_A1A3");

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFCalculationMethod" }));
    expect(element?.idShort).toBe("PCFCalculationMethod");
  });
});
