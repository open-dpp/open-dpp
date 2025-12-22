import { z } from "zod";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const AnnotatedRelationshipElementDbSchema = z.lazy(() =>
  AnnotatedRelationshipElementDbSchemaImpl(),
);

export function AnnotatedRelationshipElementDbSchemaImpl() {
  return z.object({
    ...SubmodelBaseDbSchema.shape,
    first: ReferenceDbSchema,
    second: ReferenceDbSchema,
    extensions: ExtensionDbSchema.array().default([]),
    annotations: SubmodelBaseDbSchema.array().default([]),
  });
};
