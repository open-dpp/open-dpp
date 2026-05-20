import { z } from "zod";

export const SubmodelOperationDtoTypes = {
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
  SubmodelRowDeleted: "SubmodelRowDeleted",
  SubmodelElementDeleted: "SubmodelElementDeleted",
} as const;
export const SubmodelOperationDtoTypesEnum = z.enum(SubmodelOperationDtoTypes);
export type SubmodelOperationDtoTypesType = z.infer<typeof SubmodelOperationDtoTypesEnum>;
