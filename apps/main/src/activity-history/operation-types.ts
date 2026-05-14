import { z } from "zod";

export const OperationTypes = {
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
export const OperationTypesEnum = z.enum(OperationTypes);
export type OperationTypesType = z.infer<typeof OperationTypesEnum>;
