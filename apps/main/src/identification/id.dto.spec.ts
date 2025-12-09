import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { IdShortPath } from "../aas/domain/submodel-base/submodel";
import { IdDtoSchema, IdShortPathDtoSchema } from "./id.dto";

describe("idDtoSchema", () => {
  it("should parse uuid", () => {
    const uuid = randomUUID();
    expect(IdDtoSchema.parse(uuid)).toEqual(uuid);
  });

  it("should parse base64 encoded IRI", () => {
    const url = "https://smartfactory.de/submodels/ObSfHebEIR";
    expect(IdDtoSchema.parse(btoa(url))).toEqual(url);
  });
});

describe("idShortPathDtoSchema", () => {
  it("should parse idShortPath", () => {
    const path = "path1";
    expect(IdShortPathDtoSchema.parse(path)).toEqual(IdShortPath.create({ path }));
  });

  it("should parse idShortPath with dots", () => {
    const path = "path1.path2.path3";
    expect(IdShortPathDtoSchema.parse(path)).toEqual(IdShortPath.create({ path }));
  });

  it("should fail to parse idShortPath with slash", () => {
    const path = "path1/path2/path3";
    expect(() => IdShortPathDtoSchema.parse(path)).toThrow();
  });
});
