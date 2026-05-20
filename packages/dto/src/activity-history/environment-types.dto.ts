import { z } from "zod";

export const EnvironmentOperationDtoTypes = {
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
} as const;
export const EnvironmentOperationDtoTypesEnum = z.enum(EnvironmentOperationDtoTypes);
export type EnvironmentOperationDtoTypesType = z.infer<typeof EnvironmentOperationDtoTypesEnum>;
