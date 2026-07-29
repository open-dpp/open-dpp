import { z } from "zod";

export const DigitalProductDocumentTypes = {
  Template: "template",
  Passport: "passport",
} as const;
export const DigitalProductDocumentTypesEnum = z.enum(DigitalProductDocumentTypes);
export type DigitalProductDocumentTypesType = z.infer<typeof DigitalProductDocumentTypesEnum>;
