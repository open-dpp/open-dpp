import { z } from "zod";
import { ValueTypeSchema } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import {
  SubmodelBaseJsonSchema,
  SubmodelBaseModificationSchema,
} from "./submodel-base-json-schema";

const PropertyValueDtoSchema = z.nullish(z.coerce.string());

export const PropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  value: PropertyValueDtoSchema,
  valueId: z.nullish(ReferenceJsonSchema),
});

export const PropertyModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: PropertyValueDtoSchema,
});

export type PropertyResponseDto = z.infer<typeof PropertyJsonSchema>;
export type PropertyRequestDto = z.input<typeof PropertyJsonSchema>;
export type PropertyModificationDto = z.input<typeof PropertyModificationSchema>;
