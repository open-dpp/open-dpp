import { AssetAdministrationShellType } from '@open-dpp/api-client';

export const AAS_NAME_MAPPING = {
  [AssetAdministrationShellType.Truck]: 'integrations.connections.aas.truck',
  [AssetAdministrationShellType.Semitrailer]:
    'integrations.connections.aas.semitrailer',
  [AssetAdministrationShellType.Semitrailer_Truck]:
    'integrations.connections.aas.semitrailerTruck',
};
