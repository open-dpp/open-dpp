import { z } from "zod";

export const DigitalProductDocumentOperationTypes = {
  SubmodelCreate: "SubmodelCreate",
} as const;
export const DigitalProductDocumentOperationTypesEnum = z.enum(
  DigitalProductDocumentOperationTypes,
);
export type DigitalProductDocumentOperationTypesType = z.infer<
  typeof DigitalProductDocumentOperationTypesEnum
>;
