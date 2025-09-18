import { Factory } from 'fishery';
import {
  AasConnectionDto,
  AasFieldAssignmentDto,
  AssetAdministrationShellType,
} from '@open-dpp/api-client';

export const fieldAssignmentFactory = Factory.define<AasFieldAssignmentDto>(
  () => ({
    dataFieldId: 'f1',
    sectionId: 's1',
    idShortParent: 'p1',
    idShort: 'i1',
  }),
);

export const aasConnectionFactory = Factory.define<AasConnectionDto>(
  ({ sequence }) => ({
    id: `aas-connection${sequence}`,
    name: `Connection ${sequence}`,
    modelId: 'modelId',
    aasType: AssetAdministrationShellType.Truck,
    dataModelId: 'dm1',
    fieldAssignments: fieldAssignmentFactory.buildList(1),
  }),
);
