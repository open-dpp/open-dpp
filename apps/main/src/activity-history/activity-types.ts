import { z } from "zod";

export const ActivityTypes = {
  SubmodelActivity: "SubmodelActivity",
  AssetAdministrationShellActivity: "AssetAdministrationShellActivity",
  SubmodelRowCreate: "SubmodelRowCreate",
  SubmodelCreate: "SubmodelCreate",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
