import { z } from "zod";
import { ReferenceJsonSchema } from "./common/reference-json-schema";

export const EmbeddedDataSpecificationJsonSchema = z.object({
  dataSpecification: ReferenceJsonSchema,
});
