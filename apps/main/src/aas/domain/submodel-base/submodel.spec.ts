import { randomUUID } from "node:crypto";
import { beforeAll } from "@jest/globals";
import {
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "../../fixtures/submodel.factory";
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

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandover.Street" }));
    expect(element?.idShort).toBe("Street");
  });

  it("should fail to find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    let element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprintUnknown" }));
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprintUnknown.PCFCalculationMethod" }));
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandoverUnknown.Street" }));
    expect(element).toBeUndefined();
  });

  it("should get value representation", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }));
    const element = submodel.getValueRepresentation();
    expect(element).toEqual(
      { Design_V01: {
        AdditionalInformation: {
          MotivationalVideo: "https://www.youtube.com/watch?v=G1IbRujko-A",
          CreatorIsland: "Probably _PHUCKET",
          Aufsteiger: "1. Fußball-Club Kaiserslautern e. V.",
          FileProp: {
            contentType: "image/jpeg",
            value: "aHR-Design_V01.Author.FileProp.jpg",
          },
          BlobProp: {
            contentType: "text/rtf",
            value: "e1xydGYxXGFuc2lcYW5zaWNwZzEyNTJcY29jb2FydGYyODIyClxjb2NvYXRleHRzY2FsaW5nMFxjb2NvYXBsYXRmb3JtMHtcZm9udHRibFxmMFxmc3dpc3NcZmNoYXJzZXQwIEhlbHZldGljYTt9CntcY29sb3J0Ymw7XHJlZDI1NVxncmVlbjI1NVxibHVlMjU1O30Ke1wqXGV4cGFuZGVkY29sb3J0Ymw7O30KXHBhcGVydzExOTAwXHBhcGVyaDE2ODQwXG1hcmdsMTQ0MFxtYXJncjE0NDBcdmlld3cxMTUyMFx2aWV3aDg0MDBcdmlld2tpbmQwClxwYXJkXHR4NzIwXHR4MTQ0MFx0eDIxNjBcdHgyODgwXHR4MzYwMFx0eDQzMjBcdHg1MDQwXHR4NTc2MFx0eDY0ODBcdHg3MjAwXHR4NzkyMFx0eDg2NDBccGFyZGlybmF0dXJhbFxwYXJ0aWdodGVuZmFjdG9yMAoKXGYwXGZzMjQgXGNmMCB0ZXN0fQ==",
          },
          RangeProp: {
            max: "20",
            min: "4",
          },
          MultilanguageProp: [
            {
              de: "Schnelle Übersicht",
            },
            {
              en: "Quick Overview",
            },
          ],
        },
        ApplicationSource: "Technologie-Initiative SmartFactory KL e. V.",
        ApplicationName: "Siemens NX",
        ModelName: "Truck",
        ModelFileVersion: "V1.0",
        Author: {
          AuthorOrganization: "Technologie-Initiative SmartFactory KL e. V.",
          AuthorName: "Fabrikvordenker:in ER28-0652",
        },
        ModelType: "CAD",
        ModelDescription: "prt",
      } },
    );
  });
});
