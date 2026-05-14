import { z } from "zod";

export const SubmodelOperationTypes = {
  SubmodelActivity: "SubmodelActivity",
  SubmodelModification: "SubmodelModification",
  SubmodelValueModification: "SubmodelValueModification",
  SubmodelElementModification: "SubmodelElementModification",
  SubmodelElementValueModification: "SubmodelElementValueModification",
  SubmodelColumnModification: "SubmodelColumnModification",
  AssetAdministrationShellModification: "AssetAdministrationShellModification",
  SubmodelElementCreate: "SubmodelElementCreate",
  SubmodelColumnCreate: "SubmodelColumnCreate",
  SubmodelRowCreate: "SubmodelRowCreate",
} as const;
export const SubmodelOperationTypesEnum = z.enum(SubmodelOperationTypes);
export type SubmodelOperationTypesType = z.infer<typeof SubmodelOperationTypesEnum>;
