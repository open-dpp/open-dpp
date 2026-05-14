import { z } from "zod";

export const AssetAdministrationShellOperationTypes = {
  AssetAdministrationShellModification: "AssetAdministrationShellModification",
} as const;
export const AssetAdministrationShellOperationTypesEnum = z.enum(
  AssetAdministrationShellOperationTypes,
);
export type AssetAdministrationShellOperationTypesType = z.infer<
  typeof AssetAdministrationShellOperationTypesEnum
>;
