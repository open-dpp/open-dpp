import { AssetAdministrationShellType } from "@open-dpp/api-client";

export const AAS_NAME_MAPPING = {
  [AssetAdministrationShellType.Truck]: "Truck",
  [AssetAdministrationShellType.Semitrailer]: "Sattelauflieger",
  [AssetAdministrationShellType.Semitrailer_Truck]: "Sattelschlepper",
};
