import { z } from "zod";

export const EnvironmentOperationTypes = {
  SubmodelCreate: "SubmodelCreate",
} as const;
export const EnvironmentOperationTypesEnum = z.enum(EnvironmentOperationTypes);
export type EnvironmentOperationTypesType = z.infer<typeof EnvironmentOperationTypesEnum>;
