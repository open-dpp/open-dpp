import { z } from "zod";

export const ActivityDtoTypes = {
  SubmodelAdded: "SubmodelAdded",
  SubmodelDeleted: "SubmodelDeleted",
  SubmodelModified: "SubmodelModified",
  SubmodelValueModified: "SubmodelValueModified",
  SubmodelElementModified: "SubmodelElementModified",
  SubmodelElementValueModified: "SubmodelElementValueModified",
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelElementAdded: "SubmodelElementAdded",
  RowAdded: "RowAdded",
  RowDeleted: "RowDeleted",
  ColumnAdded: "ColumnAdded",
  ColumnModified: "ColumnModified",
  ColumnDeleted: "ColumnDeleted",
  ColumnAddedToGroup: "ColumnAddedToGroup",
  ColumnModifiedInGroup: "ColumnModifiedInGroup",
  ColumnDeletedFromGroup: "ColumnDeletedFromGroup",
  ColumnMovedToGroup: "ColumnMovedToGroup",
  ColumnGroupCreated: "ColumnGroupCreated",
  SubmodelElementDeleted: "SubmodelElementDeleted",
  PolicyDeleted: "PolicyDeleted",
  DigitalProductDocumentStatusChanged: "DigitalProductDocumentStatusChanged",
} as const;
export const ActivityDtoTypesEnum = z.enum(ActivityDtoTypes);
export type ActivityDtoTypesType = z.infer<typeof ActivityDtoTypesEnum>;
