import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { z } from "zod";
import { PropertyJsonSchema } from "../domain/parsing/submodel-base/property-json-schema";

export const propertyPlainFactory
  = Factory.define<z.input<typeof PropertyJsonSchema>> (() => ({
    modelType: "Property",
    value: `some-value`,
    valueType: "xs:string",
    idShort: randomUUID(),
  }));
