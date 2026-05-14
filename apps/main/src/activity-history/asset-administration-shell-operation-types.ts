import { z } from "zod";

export const AssetAdministrationShellOperationTypes = {
  AssetAdministrationShellModification: "AssetAdministrationShellModification",
  SubmodelCreate: "SubmodelCreate",
} as const;
export const AssetAdministrationShellOperationTypesEnum = z.enum(
  AssetAdministrationShellOperationTypes,
);
export type AssetAdministrationShellOperationTypesType = z.infer<
  typeof AssetAdministrationShellOperationTypesEnum
>;
