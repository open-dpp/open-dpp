import { z } from "zod";

export const ChangeEventTypes = {
  DisplayNameChanged: "DisplayNameChanged",
  DescriptionChanged: "DescriptionChanged",
  PropertyValueChanged: "PropertyValueChanged",
  FileValueChanged: "FileValueChanged",
  ReferenceElementValueChanged: "ReferenceElementChanged",
  RowAdded: "RowAdded",
  RowDeleted: "RowDeleted",
  ColumnAdded: "ColumnAdded",
  ColumnDeleted: "ColumnDeleted",
  SubmodelAdded: "SubmodelAdded",
  AddedSubmodelToEnv: "AddedSubmodelToEnv",
  SubmodelElementAdded: "SubmodelElementAdded",
  SubmodelElementDeleted: "SubmodelElementDeleted",
  SubmodelReferenceAdded: "SubmodelReferenceAdded",
  PolicyDeleted: "PolicyDeleted",
  PolicyAdded: "PolicyAdded",
  PolicyModified: "PolicyModified",
  DefaultThumbnailsModified: "DefaultThumbnailsModified",
  DeletedSubmodelFromEnv: "DeletedSubmodelFromEnv",
  SubmodelReferenceDeleted: "SubmodelReferenceDeleted",
  SubmodelDeleted: "SubmodelDeleted",
} as const;
export const ChangeEventTypeEnum = z.enum(ChangeEventTypes);
export type ChangeEventTypesType = z.infer<typeof ChangeEventTypeEnum>;
