import { describe, expect, it } from "vitest";
import { makeIdShortPathPointer } from "./id-short-path-select.ts";

describe("makeIdShortPathPointer", () => {
  it("exposes the wrapped pointer's own fields", () => {
    const pointer = makeIdShortPathPointer({
      submodelIdShort: "DesignOfProduct",
      idShortPath: "Design_V01.Author",
    });
    expect(pointer.submodelIdShort).toBe("DesignOfProduct");
    expect(pointer.idShortPath).toBe("Design_V01.Author");
  });

  describe("contains", () => {
    it("is true for itself", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author",
      });
      expect(
        pointer.contains({ submodelIdShort: "DesignOfProduct", idShortPath: "Design_V01.Author" }),
      ).toBe(true);
    });

    it("is true for anything nested beneath it, in the same submodel", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01",
      });
      expect(
        pointer.contains({ submodelIdShort: "DesignOfProduct", idShortPath: "Design_V01.Author" }),
      ).toBe(true);
      expect(
        pointer.contains({
          submodelIdShort: "DesignOfProduct",
          idShortPath: "Design_V01.Author.AuthorName",
        }),
      ).toBe(true);
    });

    it("is false for a match in a different submodel", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01",
      });
      expect(
        pointer.contains({ submodelIdShort: "CarbonFootprint", idShortPath: "Design_V01.Author" }),
      ).toBe(false);
    });

    it("is false for a sibling or unrelated path", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author",
      });
      expect(
        pointer.contains({
          submodelIdShort: "DesignOfProduct",
          idShortPath: "Design_V01.AdditionalInformation",
        }),
      ).toBe(false);
    });

    it("the submodel root contains every path within its own submodel", () => {
      const root = makeIdShortPathPointer({ submodelIdShort: "DesignOfProduct", idShortPath: "" });
      expect(
        root.contains({ submodelIdShort: "DesignOfProduct", idShortPath: "Design_V01.Author" }),
      ).toBe(true);
      expect(root.contains({ submodelIdShort: "CarbonFootprint", idShortPath: "Anything" })).toBe(
        false,
      );
    });
  });

  describe("isDirectChildOf", () => {
    it("is true for its immediate parent, in the same submodel", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author",
      });
      expect(
        pointer.isDirectChildOf({ submodelIdShort: "DesignOfProduct", idShortPath: "Design_V01" }),
      ).toBe(true);
    });

    it("is false for the same idShortPath in a different submodel", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author",
      });
      expect(
        pointer.isDirectChildOf({ submodelIdShort: "CarbonFootprint", idShortPath: "Design_V01" }),
      ).toBe(false);
    });

    it("is false for a grandparent or any other non-immediate ancestor", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author.AuthorName",
      });
      expect(
        pointer.isDirectChildOf({ submodelIdShort: "DesignOfProduct", idShortPath: "Design_V01" }),
      ).toBe(false);
    });

    it("a top-level element is a direct child of the submodel root", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01",
      });
      expect(pointer.isDirectChildOf({ submodelIdShort: "DesignOfProduct", idShortPath: "" })).toBe(
        true,
      );
    });

    it("is false for itself or an unrelated path", () => {
      const pointer = makeIdShortPathPointer({
        submodelIdShort: "DesignOfProduct",
        idShortPath: "Design_V01.Author",
      });
      expect(
        pointer.isDirectChildOf({
          submodelIdShort: "DesignOfProduct",
          idShortPath: "Design_V01.Author",
        }),
      ).toBe(false);
      expect(
        pointer.isDirectChildOf({
          submodelIdShort: "DesignOfProduct",
          idShortPath: "Design_V01.AdditionalInformation",
        }),
      ).toBe(false);
    });
  });
});
