import { randomUUID } from "node:crypto";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { IdParamSchema, IdShortPathParamSchema, PositionQueryParamSchema } from "./aas.decorators";

describe("query params", () => {
  it("should parse position", () => {
    const position = "1";
    expect(PositionQueryParamSchema.parse(position)).toEqual(1);
  });

  describe("idParamSchema", () => {
    it("should parse uuid", () => {
      const uuid = randomUUID();
      expect(IdParamSchema.parse(uuid)).toEqual(uuid);
    });

    it("should parse base64 encoded IRI", () => {
      const url = "https://smartfactory.de/submodels/ObSfHebEIR";
      expect(IdParamSchema.parse(btoa(url))).toEqual(url);
    });
  });
});

describe("idShortPathParamSchema", () => {
  it("should parse idShortPath", () => {
    const path = "path1";
    expect(IdShortPathParamSchema.parse(path)).toEqual(IdShortPath.create({ path }));
  });

  it("should parse idShortPath with dots", () => {
    const path = "Design_V01.Author.AuthorName";
    expect(IdShortPathParamSchema.parse(path)).toEqual(IdShortPath.create({ path }));
  });

  it("should fail to parse idShortPath with slash", () => {
    const path = "path1/path2/path3";
    expect(() => IdShortPathParamSchema.parse(path)).toThrow();
  });
});
