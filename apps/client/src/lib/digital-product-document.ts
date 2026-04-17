import { z } from "zod";

export const DigitalProductDocumentType = {
  Passport: "passport",
  Template: "template",
} as const;
export const DigitalProductDocumentTypeEnum = z.enum(DigitalProductDocumentType);
export type DigitalProductDocumentTypeType = z.infer<typeof DigitalProductDocumentTypeEnum>;
