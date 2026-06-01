import { z } from "zod";

export const ActivityTypes = {
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
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
