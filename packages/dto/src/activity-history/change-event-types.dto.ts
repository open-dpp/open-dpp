import { z } from "zod";

export const ChangeEventDtoTypes = {
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
  DigitalProductDocumentStatusChanged: "DigitalProductDocumentStatusChanged",
  ColumnAddedToGroup: "ColumnAddedToGroup",
  ColumnDeletedFromGroup: "ColumnDeletedFromGroup",
  ColumnModifiedInGroup: "ColumnModifiedInGroup",
  ColumnMovedToGroup: "ColumnMovedToGroup",
  SubmodelElementMoved: "SubmodelElementMoved",
  SubmodelMoved: "SubmodelMoved",
} as const;
export const ChangeEventDtoTypeEnum = z.enum(ChangeEventDtoTypes);
export type ChangeEventDtoTypesType = z.infer<typeof ChangeEventDtoTypeEnum>;
