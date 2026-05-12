import { z } from "zod";

export const ActivityTypes = {
  SubmodelModification: "SubmodelModification",
  SubmodelElementModification: "SubmodelElementModification",
  SubmodelElementValueModification: "SubmodelElementValueModification",
  SubmodelColumnModification: "SubmodelColumnModification",
  AssetAdministrationShellModification: "AssetAdministrationShellModification",
  SubmodelElementCreate: "SubmodelElementCreate",
  SubmodelColumnCreate: "SubmodelColumnCreate",
  SubmodelRowCreate: "SubmodelRowCreate",
  SubmodelCreate: "SubmodelCreate",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
