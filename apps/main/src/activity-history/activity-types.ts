import { z } from "zod";

export const ActivityTypes = {
  SubmodelActivity: "SubmodelActivity",
  AssetAdministrationShellActivity: "AssetAdministrationShellActivity",
  SubmodelElementCreate: "SubmodelElementCreate",
  SubmodelColumnCreate: "SubmodelColumnCreate",
  SubmodelRowCreate: "SubmodelRowCreate",
  SubmodelCreate: "SubmodelCreate",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
