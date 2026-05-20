import { z } from "zod";

export const AssetAdministrationShellOperationDtoTypes = {
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
  PolicyDeleted: "PolicyDeleted",
} as const;
export const AssetAdministrationShellOperationDtoTypesEnum = z.enum(
  AssetAdministrationShellOperationDtoTypes,
);
export type AssetAdministrationShellOperationDtoTypesType = z.infer<
  typeof AssetAdministrationShellOperationDtoTypesEnum
>;
