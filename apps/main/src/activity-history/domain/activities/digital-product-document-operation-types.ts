import { z } from "zod";

export const DigitalProductDocumentOperationTypes = {
  StatusModified: "StatusModified",
} as const;
export const DigitalProductDocumentOperationTypesEnum = z.enum(
  DigitalProductDocumentOperationTypes,
);
export type DigitalProductDocumentOperationTypesType = z.infer<
  typeof DigitalProductDocumentOperationTypesEnum
>;
