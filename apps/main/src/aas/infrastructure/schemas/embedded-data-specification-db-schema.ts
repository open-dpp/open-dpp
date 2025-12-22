import { z } from "zod";
import { ReferenceDbSchema } from "./common/reference-db-schema";

export const EmbeddedDataSpecificationDbSchema = z.object({
  dataSpecification: ReferenceDbSchema,
});
