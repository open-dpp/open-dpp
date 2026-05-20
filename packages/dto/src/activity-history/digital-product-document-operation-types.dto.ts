import { z } from "zod";

export const DigitalProductDocumentOperationDtoTypes = {
  StatusModified: "StatusModified",
} as const;
export const DigitalProductDocumentOperationDtoTypesEnum = z.enum(
  DigitalProductDocumentOperationDtoTypes,
);
export type DigitalProductDocumentOperationDtoTypesType = z.infer<
  typeof DigitalProductDocumentOperationDtoTypesEnum
>;
