import { z } from "zod";

export const ActivityTypes = {
  SubmodelActivity: "SubmodelActivity",
  AssetAdministrationShellActivity: "AssetAdministrationShellActivity",
  EnvironmentActivity: "EnvironmentActivity",
  SubmodelRepositoryActivity: "SubmodelRepositoryActivity",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
