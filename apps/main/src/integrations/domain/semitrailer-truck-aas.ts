export const semitrailerTruckAas = {
  assetAdministrationShells: [
    {
      modelType: 'AssetAdministrationShell',
      assetInformation: {
        assetKind: 'Instance',
        assetType: 'product',
        globalAssetId: 'Semitrailer_Truck_-10204004-0010-02',
      },
      submodels: [
        {
          keys: [
            {
              type: 'Submodel',
              value: 'Semitrailer_Truck_-10204004-0010-02_Nameplate',
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: 'GlobalReference',
                value: 'Semitrailer_Truck_-10204004-0010-02_Nameplate',
              },
            ],
          },
          type: 'ExternalReference',
        },
        {
          keys: [
            {
              type: 'Submodel',
              value: 'Semitrailer_Truck_-10204004-0010-02_CarbonFootprint',
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: 'GlobalReference',
                value: 'Semitrailer_Truck_-10204004-0010-02_CarbonFootprint',
              },
            ],
            type: 'ExternalReference',
          },
          type: 'ExternalReference',
        },
      ],
      extensions: [
        {
          name: 'namespace',
          value: 'Product',
          valueType: 'xs:string',
        },
        {
          name: 'isRootOfProductTree',
          value: 'true',
        },
      ],
      id: 'Semitrailer_Truck_-10204004-0010-02',
      displayName: [
        {
          language: 'DE',
          text: 'de.proalpha.product.semitrailer_truck',
        },
      ],
      idShort: 'Semitrailer_Truck',
    },
  ],
  submodels: [
    {
      modelType: 'Submodel',
      kind: 'Instance',
      semanticID: {
        keys: [
          {
            type: 'GlobalReference',
            value: 'https:\/\/admin-shell.io\/idta\/nameplate\/3\/0\/Nameplate',
          },
        ],
        type: 'ExternalReference',
      },
      administration: {
        revision: '0',
        templateID: 'https:\/\/admin-shell.io\/IDTA 02006-3-0',
        version: '3',
      },
      id: 'Semitrailer_Truck_-10204004-0010-02_Nameplate',
      description: [
        {
          language: 'DE',
          text: 'Informationen über das Digitale Typenschild des Produktes',
        },
      ],
      idShort: 'Nameplate',
      submodelElements: [
        {
          modelType: 'Property',
          value: '0112\/2\/\/\/61987#TR590#900',
          valueType: 'xs:string',
          idShort: 'URIOfTheProduct',
        },
        {
          modelType: 'Property',
          value: 'Proalpha GmbH',
          valueType: 'xs:string',
          idShort: 'ManufacturerName',
        },
        {
          modelType: 'Property',
          value: 'Semitrailer_Truck',
          valueType: 'xs:string',
          idShort: 'ManufacturerProductDesignation',
        },
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'AddressInformation',
          value: [
            {
              modelType: 'Property',
              value: 'Product Developer',
              valueType: 'xs:string',
              idShort: 'RoleOfContactPerson',
            },
            {
              modelType: 'Property',
              value: 'Dr.',
              valueType: 'xs:string',
              idShort: 'Title',
            },
            {
              modelType: 'Property',
              value: 'DE',
              valueType: 'xs:string',
              idShort: 'NationalCode',
            },
            {
              modelType: 'Property',
              value: 'DE',
              valueType: 'xs:string',
              idShort: 'Language',
            },
            {
              modelType: 'Property',
              value: 'GMT+2',
              valueType: 'xs:string',
              idShort: 'TimeZone',
            },
            {
              modelType: 'Property',
              value: 'Weilerbach',
              valueType: 'xs:string',
              idShort: 'CityTown',
            },
            {
              modelType: 'Property',
              value: 'Proalpha GmbH',
              valueType: 'xs:string',
              idShort: 'Company',
            },
            {
              modelType: 'Property',
              value: 'R&D',
              valueType: 'xs:string',
              idShort: 'Department',
            },
            {
              modelType: 'Property',
              value: 'Auf dem Immel 8',
              valueType: 'xs:string',
              idShort: 'Street',
            },
            {
              modelType: 'Property',
              value: '67685',
              valueType: 'xs:string',
              idShort: 'Zipcode',
            },
            {
              modelType: 'Property',
              value: '1',
              valueType: 'xs:string',
              idShort: 'POBox',
            },
            {
              modelType: 'Property',
              value: '67685',
              valueType: 'xs:string',
              idShort: 'ZipCodeOfPOBox',
            },
            {
              modelType: 'Property',
              value: 'Rheinland-Pfalz',
              valueType: 'xs:string',
              idShort: 'StateCounty',
            },
            {
              modelType: 'Property',
              value: '',
              valueType: 'xs:string',
              idShort: 'NameOfContact',
            },
            {
              modelType: 'Property',
              value: '',
              valueType: 'xs:string',
              idShort: 'FirstName',
            },
            {
              modelType: 'Property',
              value: 'Vehicle',
              valueType: 'xs:string',
              idShort: 'ManufacturerProductRoot',
            },
            {
              modelType: 'Property',
              value: 'Commercial Vehicle',
              valueType: 'xs:string',
              idShort: 'ManufacturerProductFamily',
            },
            {
              modelType: 'Property',
              value: 'Semitrailer_Truck',
              valueType: 'xs:string',
              idShort: 'ManufacturerProductType',
            },
            {
              modelType: 'Property',
              value: '2025',
              valueType: 'xs:string',
              idShort: 'YearOfConstruction',
            },
            {
              modelType: 'Property',
              value: '2025-06-10',
              valueType: 'xs:date',
              idShort: 'DateOfManufacture',
            },
            {
              modelType: 'Property',
              value: 'HW2025-G123-02',
              valueType: 'xs:string',
              idShort: 'HardwareVersion',
            },
            {
              modelType: 'Property',
              value: 'SW2025-G123-02',
              valueType: 'xs:string',
              idShort: 'SoftwareVersion',
            },
            {
              modelType: 'Property',
              value: 'DE',
              valueType: 'xs:string',
              idShort: 'CountryOfOrigin',
            },
            {
              modelType: 'Property',
              value: '',
              valueType: 'xs:string',
              idShort: 'CompanyLogo',
            },
          ],
        },
      ],
    },
    {
      modelType: 'Submodel',
      kind: 'Instance',
      semanticID: {
        keys: [
          {
            type: 'GlobalReference',
            value:
              'https:\/\/admin-shell.io\/idta\/CarbonFootprint\/CarbonFootprint\/0\/9',
          },
        ],
        type: 'ModelReference',
      },
      administration: {
        revision: '9',
        templateID:
          'https:\/\/admin-shell.io\/idta\/CarbonFootprint\/CarbonFootprint\/0\/9',
        version: '0',
      },
      id: 'Semitrailer_Truck_-10204004-0010-02_CarbonFootprint',
      description: [
        {
          language: 'DE',
          text: 'Informationen über den CO2-Fußabdruck des Produktes',
        },
      ],
      idShort: 'CarbonFootprint',
      submodelElements: [
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'ProductCarbonFootprint_A1A3',
          value: [
            {
              modelType: 'Property',
              value: 'GHG',
              valueType: 'xs:string',
              idShort: 'PCFCalculationMethod',
            },
            {
              modelType: 'Property',
              value: '2.6300',
              valueType: 'xs:double',
              idShort: 'PCFCO2eq',
            },
            {
              modelType: 'Property',
              value: 'Piece',
              valueType: 'xs:string',
              idShort: 'PCFReferenceValueForCalculation',
            },
            {
              modelType: 'Property',
              value: '1.0',
              valueType: 'xs:double',
              idShort: 'PCFQuantityOfMeasureForCalculation',
            },
            {
              modelType: 'Property',
              value: 'A1-A3',
              valueType: 'xs:string',
              idShort: 'PCFLifeCyclePhase',
            },
            {
              modelType: 'Property',
              value: '2025-06-11',
              valueType: 'xs:date',
              idShort: 'PublicationDate',
            },
            {
              modelType: 'SubmodelElementCollection',
              idShort: 'PCFGoodsAddressHandover',
              value: [
                {
                  modelType: 'Property',
                  value: 'Auf dem Immel',
                  valueType: 'xs:string',
                  idShort: 'Street',
                },
                {
                  modelType: 'Property',
                  value: '8',
                  valueType: 'xs:string',
                  idShort: 'HouseNumber',
                },
                {
                  modelType: 'Property',
                  value: '67685',
                  valueType: 'xs:string',
                  idShort: 'ZipCode',
                },
                {
                  modelType: 'Property',
                  value: 'Weilerbach',
                  valueType: 'xs:string',
                  idShort: 'CityTown',
                },
                {
                  modelType: 'Property',
                  value: 'Germany',
                  valueType: 'xs:string',
                  idShort: 'Country',
                },
                {
                  modelType: 'Property',
                  value: '49.478269',
                  valueType: 'xs:string',
                  idShort: 'Latitude',
                },
                {
                  modelType: 'Property',
                  value: '7.608461',
                  valueType: 'xs:string',
                  idShort: 'Latitude',
                },
              ],
            },
            {
              modelType: 'Property',
              value: '',
              valueType: 'xs:string',
              idShort: 'PCFFactSheet',
            },
          ],
        },
      ],
    },
  ],
}
