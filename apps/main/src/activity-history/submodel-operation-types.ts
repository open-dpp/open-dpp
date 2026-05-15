import { z } from "zod";

export const SubmodelOperationTypes = {
  SubmodelModified: "SubmodelModified",
  SubmodelValueModified: "SubmodelValueModified",
  SubmodelElementModified: "SubmodelElementModified",
  SubmodelElementValueModified: "SubmodelElementValueModified",
  SubmodelColumnModified: "SubmodelColumnModified",
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelElementAdded: "SubmodelElementAdded",
  SubmodelColumnAdded: "SubmodelColumnAdded",
  SubmodelRowAdded: "SubmodelRowAdded",
  SubmodelColumnDeleted: "SubmodelColumnDeleted",
} as const;
export const SubmodelOperationTypesEnum = z.enum(SubmodelOperationTypes);
export type SubmodelOperationTypesType = z.infer<typeof SubmodelOperationTypesEnum>;
