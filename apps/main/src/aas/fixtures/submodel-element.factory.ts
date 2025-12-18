import { randomUUID } from "node:crypto";
import { PropertyJsonSchema } from "@open-dpp/aas";
import { Factory } from "fishery";
import { z } from "zod";

export const propertyPlainFactory
  = Factory.define<z.input<typeof PropertyJsonSchema>> (() => ({
    modelType: "Property",
    value: `some-value`,
    valueType: "xs:string",
    idShort: randomUUID(),
  }));
