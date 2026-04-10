import { z } from "zod/v4";
import { ReferenceElementDbSchema } from "../submodel-base/reference-element-db-schema";
import { PermissionDbSchema } from "./permission-db-schema";

export const PermissionPerObjectDbSchema = z.object({
  object: ReferenceElementDbSchema,
  permissions: z.array(PermissionDbSchema),
});
