import { z } from "zod";

export const ActivityDtoTypes = {
  SubmodelAdded: "SubmodelAdded",
  SubmodelDeleted: "SubmodelDeleted",
  SubmodelModified: "SubmodelModified",
  SubmodelValueModified: "SubmodelValueModified",
  SubmodelElementModified: "SubmodelElementModified",
  SubmodelElementValueModified: "SubmodelElementValueModified",
  SubmodelColumnModified: "SubmodelColumnModified",
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelElementAdded: "SubmodelElementAdded",
  SubmodelColumnAdded: "SubmodelColumnAdded",
  RowAdded: "RowAdded",
  RowDeleted: "RowDeleted",
  ColumnAdded: "ColumnAdded",
  ColumnModified: "ColumnModified",
  ColumnDeleted: "ColumnDeleted",
  SubmodelColumnDeleted: "SubmodelColumnDeleted",
  SubmodelRowDeleted: "SubmodelRowDeleted",
  SubmodelElementDeleted: "SubmodelElementDeleted",
  PolicyDeleted: "PolicyDeleted",
  DigitalProductDocumentStatusChanged: "DigitalProductDocumentStatusChanged",
} as const;
export const ActivityDtoTypesEnum = z.enum(ActivityDtoTypes);
export type ActivityDtoTypesType = z.infer<typeof ActivityDtoTypesEnum>;
