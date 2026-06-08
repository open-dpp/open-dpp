import { z } from "zod";

export const ActivityTypes = {
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
  SubmodelElementDeleted: "SubmodelElementDeleted",
  PolicyDeleted: "PolicyDeleted",
  DigitalProductDocumentStatusChanged: "DigitalProductDocumentStatusChanged",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
