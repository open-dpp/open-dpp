import { randomUUID } from "node:crypto";
import { PropertyJsonSchema } from "@open-dpp/dto";
import { Factory } from "fishery";
import { z } from "zod";

export const propertyPlainFactory
  = Factory.define<z.input<typeof PropertyJsonSchema>> (() => ({
    modelType: "Property",
    value: `some-value`,
    valueType: "xs:string",
    idShort: randomUUID(),
  }));
