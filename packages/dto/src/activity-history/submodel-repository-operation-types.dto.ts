import { z } from "zod";

export const SubmodelRepositoryOperationDtoTypes = {
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
} as const;
export const SubmodelRepositoryOperationDtoTypesEnum = z.enum(SubmodelRepositoryOperationDtoTypes);
export type SubmodelRepositoryOperationDtoTypesType = z.infer<
  typeof SubmodelRepositoryOperationDtoTypesEnum
>;
