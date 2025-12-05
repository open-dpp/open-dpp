import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { IdDtoSchema } from "./id.dto";

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
