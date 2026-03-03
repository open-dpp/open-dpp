import type { AssetAdministrationShellJsonSchema } from '@open-dpp/dto'
import type { z } from 'zod'
import { Factory } from 'fishery'

interface AasTransientParams {
  iriDomain: string
}

export const aasPlainFactory
  = Factory.define<z.input<typeof AssetAdministrationShellJsonSchema>, AasTransientParams> (({ transientParams }) => ({
    modelType: 'AssetAdministrationShell',
    assetInformation: {
      assetKind: 'Instance',
      assetType: 'product',
      defaultThumbnails: [{
        contentType: 'image/png',
        path: 'https://raw.githubusercontent.com/SmartFactory-KL/thumbnails/refs/heads/main/truck/Truck.png',
      }],
      globalAssetId: `${transientParams.iriDomain}/assets/zm6As5rG-h`,
    },
    submodels: [
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/k9u4UhbfeY`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: 'https://xitaso.com/BillOfApplications',
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/IexIFXJ0YL`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: 'http://example.com/id/type/submodel/BOM/1/1',
            },
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/Truck/BillOfMaterial#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/ObSfHebEIR`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9',
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/ap3eDlX07V`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/CommercialProperties#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/2CZc64Umg5`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/DesignOfProduct#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/u-OoAXBcS9`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/MaterialData#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/FHQAji8hF7`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: 'https://admin-shell.io/idta/nameplate/3/0/Nameplate',
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/JYxmp8RpoK`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/Offers#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/SuccLBA6uS`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/ProductIdentification#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/vyLbhavxNR`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/QualityInformation#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/PJB9h1jH2s`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/RequestForServices#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/chpKK0Q-N7`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: `${transientParams.iriDomain}/semantics/submodel/CapabilityDescription#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/B5t9hU0siU`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'GlobalReference',
              value: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
      {
        keys: [
          {
            type: 'Submodel',
            value: `${transientParams.iriDomain}/submodels/7e00b513-44d1-4fb5-9779-efcdf5ed6cda`,
          },
        ],
        referredSemanticId: {
          keys: [
            {
              type: 'Submodel',
              value: `${transientParams.iriDomain}/semantics/submodel/ProductionPlan#1/0`,
            },
          ],
          type: 'ExternalReference',
        },
        type: 'ModelReference',
      },
    ],
    extensions: [
      {
        name: 'namespace',
        value: 'Product',
        valueType: 'xs:string',
      },
      {
        name: 'shellViewId',
        value: 'de.smartfactory.shell-view-id.production-plan-view',
        valueType: 'xs:string',
      },
      {
        name: 'sfProductId',
        value: 'n/a',
        valueType: 'xs:string',
      },
      {
        name: 'sfProductClassId',
        value: 'de.smartfactory.product.truck',
        valueType: 'xs:string',
      },
      {
        name: 'isRootOfProductTree',
        value: 'true',
      },
    ],
    id: `${transientParams.iriDomain}/shells/-SR7BbncJG`,
    displayName: [
      {
        language: 'de',
        text: 'de.smartfactory.product.truck',
      },
    ],
    idShort: 'Truck',
  }))
