import { describe, expect } from "@jest/globals";
import { JsonTransformer } from "./json-transformer";
import { FieldMapping } from "./field-mapping";

describe("JsonTransformer", () => {
  it("should be applied", async () => {
    const transformer = JsonTransformer.create({});
    transformer.addFieldMapping(
      FieldMapping.create({ input: "parentOld.childOld1", output: "parentNew.childNew1" }),
    );
    transformer.addFieldMapping(
      FieldMapping.create({ input: "parentOld.childOld2", output: "parentNew.childNew2" }),
    );
    transformer.addFieldMapping(
      FieldMapping.create({ input: "parentOld.childOld2", output: "parentNew.sub.childNew2" }),
    );

    const input = {
      parentOld: {
        childOld1: "value1",
        childOld2: "value2",
      },
      anotherOld: {
        nestedOld: "value3",
      },
    };
    const output = await transformer.apply(input);
    expect(output).toEqual({
      parentNew: {
        childNew1: "value1",
        childNew2: "value2",
        sub: {
          childNew2: "value2",
        },
      },
    });
  });

  it("should round-trip through toPlain", () => {
    const transformer = JsonTransformer.create({});
    transformer.addFieldMapping(FieldMapping.create({ input: "sku", output: "technicalData.sku" }));

    expect(transformer.toPlain()).toEqual({
      fieldMappings: [{ input: "sku", output: "technicalData.sku" }],
    });
  });

  it("evaluatePath should extract a nested value", async () => {
    const value = await JsonTransformer.evaluatePath("parentOld.childOld1", {
      parentOld: { childOld1: "value1" },
    });
    expect(value).toEqual("value1");
  });
});
