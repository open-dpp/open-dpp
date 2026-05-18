import { z } from "zod";

export const EnvironmentOperationTypes = {
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
} as const;
export const EnvironmentOperationTypesEnum = z.enum(EnvironmentOperationTypes);
export type EnvironmentOperationTypesType = z.infer<typeof EnvironmentOperationTypesEnum>;
