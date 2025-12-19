import { expect } from "@jest/globals";
import { ReferenceTypes } from "@open-dpp/dto";
import { Reference } from "./reference";

describe("reference", () => {
  it("should be created from plain", () => {
    const plain = {
      type: "ModelReference",
      referredSemanticId:
        {
          type: "ExternalReference",
          keys: [{
            type: "ReferenceElement",
            value: "https://example.com",
          }],
        },
      keys: [{
        type: "Submodel",
        value: "submodel102",
      }],
    };
    const reference = Reference.fromPlain(plain);
    expect(reference.type).toEqual(ReferenceTypes.ModelReference);
    expect(reference.referredSemanticId?.type).toEqual(ReferenceTypes.ExternalReference);
  });
});
