import { z } from "zod";

export const ActivityTypes = {
  SubmodelModified: "SubmodelModified",
  SubmodelValueModified: "SubmodelValueModified",
  SubmodelElementModified: "SubmodelElementModified",
  SubmodelElementValueModified: "SubmodelElementValueModified",
  SubmodelColumnModified: "SubmodelColumnModified",
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelElementAdded: "SubmodelElementAdded",
  SubmodelColumnAdded: "SubmodelColumnAdded",
  RowAdded: "RowAdded",
  SubmodelColumnDeleted: "SubmodelColumnDeleted",
  SubmodelRowDeleted: "SubmodelRowDeleted",
  SubmodelElementDeleted: "SubmodelElementDeleted",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
