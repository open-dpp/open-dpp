import { z } from "zod";

export const AssetAdministrationShellOperationTypes = {
  AssetAdministrationShellModified: "AssetAdministrationShellModified",
  SubmodelCreated: "SubmodelCreated",
  SubmodelDeleted: "SubmodelDeleted",
  PolicyDeleted: "PolicyDeleted",
} as const;
export const AssetAdministrationShellOperationTypesEnum = z.enum(
  AssetAdministrationShellOperationTypes,
);
export type AssetAdministrationShellOperationTypesType = z.infer<
  typeof AssetAdministrationShellOperationTypesEnum
>;
