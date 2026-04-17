import {
  DateTimeSchema,
  EnvironmentJsonSchema,
  ExtendedEnvironmentJsonSchema,
} from "@open-dpp/dto";
import { z } from "zod";
import { DigitalProductDocumentStatusChangeSchema } from "./digital-product-document-status";

export const DigitalProductDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: z.union([EnvironmentJsonSchema, ExtendedEnvironmentJsonSchema]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  lastStatusChange: DigitalProductDocumentStatusChangeSchema,
});
