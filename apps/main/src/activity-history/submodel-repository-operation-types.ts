import { z } from "zod";

export const SubmodelRepositoryOperationTypes = {
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
} as const;
export const SubmodelRepositoryOperationTypesEnum = z.enum(SubmodelRepositoryOperationTypes);
export type SubmodelRepositoryOperationTypesType = z.infer<
  typeof SubmodelRepositoryOperationTypesEnum
>;
