import { expect } from "@jest/globals";
import { KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Reference } from "./reference";
import { Key } from "./key";
import { IdShortPath } from "./id-short-path";

describe("reference", () => {
  it("should be created from plain", () => {
    const plain = {
      type: "ModelReference",
      referredSemanticId: {
        type: "ExternalReference",
        keys: [
          {
            type: "ReferenceElement",
            value: "https://example.com",
          },
        ],
      },
      keys: [
        {
          type: "Submodel",
          value: "submodel102",
        },
      ],
    };
    const reference = Reference.fromPlain(plain);
    expect(reference.type).toEqual(ReferenceTypes.ModelReference);
    expect(reference.referredSemanticId?.type).toEqual(ReferenceTypes.ExternalReference);
  });

  it("should be created from plain", () => {
    const reference = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [],
    });
    const key = Key.create({ type: KeyTypes.Property, value: "prop1" });

    expect(reference.addKey(key).keys).toEqual([key]);
  });

  it("should construct IdShortPaths", () => {
    const reference = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [
        Key.create({ type: KeyTypes.Submodel, value: "submodel1" }),
        Key.create({ type: KeyTypes.SubmodelElementList, value: "table1" }),
        Key.create({ type: KeyTypes.SubmodelElementCollection, value: "row1" }),
        Key.create({ type: KeyTypes.SubmodelElementList, value: "table11" }),
        Key.create({ type: KeyTypes.SubmodelElementCollection, value: "row11" }),
        Key.create({ type: KeyTypes.Property, value: "prop1" }),
      ],
    });
    expect(reference.constructIdShortPathsForType(KeyTypes.SubmodelElementList)).toEqual([
      IdShortPath.create({ path: "submodel1.table1" }),
      IdShortPath.create({ path: "submodel1.table1.row1.table11" }),
    ]);
    expect(reference.constructIdShortPathsForType(KeyTypes.SubmodelElementCollection)).toEqual([
      IdShortPath.create({ path: "submodel1.table1.row1" }),
      IdShortPath.create({ path: "submodel1.table1.row1.table11.row11" }),
    ]);
    expect(reference.asIdShortPath()).toEqual(
      IdShortPath.create({ path: "submodel1.table1.row1.table11.row11.prop1" }),
    );
  });
});
