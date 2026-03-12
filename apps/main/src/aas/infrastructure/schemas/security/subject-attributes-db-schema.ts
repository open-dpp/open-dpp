import { z } from "zod";
import { PropertyDbSchema } from "../submodel-base/property-db-schema";

export const SubjectAttributesDbSchema = z.object({
  subjectAttribute: PropertyDbSchema.array(),
});
