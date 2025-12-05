import { Factory } from "fishery";
import { z } from "zod/index";
import { SubmodelJsonSchema } from "../domain/parsing/submodel-base/submodel-json-schema";

interface SubmodelTransientParams {
  iriDomain: string;
}

export const submodelDesignOfProductPlainFactory
  = Factory.define<z.input<typeof SubmodelJsonSchema>, SubmodelTransientParams> (({ transientParams }) => ({
    modelType: "Submodel",
    kind: "Instance",
    semanticId: {
      keys: [
        {
          type: "GlobalReference",
          value: `${transientParams.iriDomain}/semantics/submodel/DesignOfProduct#1/0`,
        },
      ],
      type: "ExternalReference",
    },
    id: `${transientParams.iriDomain}/submodels/2CZc64Umg5`,
    idShort: "DesignOfProduct",
    submodelElements: [
      {
        modelType: "SubmodelElementCollection",
        idShort: "Design_V01",
        value: [
          {
            modelType: "SubmodelElementCollection",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "Author",
                },
              ],
              type: "ExternalReference",
            },
            idShort: "Author",
            value: [
              {
                modelType: "Property",
                semanticId: {
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "AuthorName",
                    },
                  ],
                  type: "ExternalReference",
                },
                value: "Fabrikvordenker:in ER28-0652",
                valueType: "xs:string",
                idShort: "AuthorName",
              },
              {
                modelType: "Property",
                semanticId: {
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "AuthorOrganization",
                    },
                  ],
                  type: "ExternalReference",
                },
                value: "Technologie-Initiative SmartFactory KL e. V.",
                valueType: "xs:string",
                idShort: "AuthorOrganization",
              },
            ],
          },
          {
            modelType: "SubmodelElementCollection",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "AdditionalInformation",
                },
              ],
              type: "ExternalReference",
            },
            idShort: "AdditionalInformation",
            value: [
              {
                modelType: "Property",
                semanticId: {
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "AuthorName",
                    },
                  ],
                  type: "ExternalReference",
                },
                value: "Probably _PHUCKET",
                valueType: "xs:string",
                idShort: "CreatorIsland",
              },
              {
                modelType: "Property",
                semanticId: {
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "AuthorOrganization",
                    },
                  ],
                  type: "ExternalReference",
                },
                value: "1. Fußball-Club Kaiserslautern e. V.",
                valueType: "xs:string",
                idShort: "Aufsteiger",
              },
              {
                modelType: "Property",
                semanticId: {
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "ApplicationName",
                    },
                  ],
                  type: "ExternalReference",
                },
                value: "https://www.youtube.com/watch?v=G1IbRujko-A",
                valueType: "xs:string",
                idShort: "MotivationalVideo",
              },
            ],
          },
          {
            modelType: "Property",
            value: "Technologie-Initiative SmartFactory KL e. V.",
            valueType: "xs:string",
            idShort: "ApplicationSource",
          },
          {
            modelType: "Property",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "ApplicationName",
                },
              ],
              type: "ExternalReference",
            },
            value: "Siemens NX",
            valueType: "xs:string",
            idShort: "ApplicationName",
          },
          {
            modelType: "Property",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "ModelDescription",
                },
              ],
              type: "ExternalReference",
            },
            value: "prt",
            valueType: "xs:string",
            idShort: "ModelDescription",
          },
          {
            modelType: "Property",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "ModelType",
                },
              ],
              type: "ExternalReference",
            },
            value: "CAD",
            valueType: "xs:string",
            idShort: "ModelType",
          },
          {
            modelType: "Property",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "ModelFileVersion",
                },
              ],
              type: "ExternalReference",
            },
            value: "V1.0",
            valueType: "xs:string",
            idShort: "ModelFileVersion",
          },
          {
            modelType: "Property",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "ModelName",
                },
              ],
              type: "ExternalReference",
            },
            value: "Truck",
            valueType: "xs:string",
            idShort: "ModelName",
          },
        ],
      },
    ],
  }));

export const submodelCarbonFootprintPlainFactory = Factory.define<z.input<typeof SubmodelJsonSchema>, SubmodelTransientParams>(({ transientParams }) => ({
  modelType: "Submodel",
  kind: "Instance",
  semanticId: {
    keys: [
      {
        type: "GlobalReference",
        value: "https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9",
      },
    ],
    type: "ExternalReference",
  },
  administration: {
    revision: "9",
    templateId: "https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9",
    version: "0",
  },
  id: `${transientParams.iriDomain}/submodels/ObSfHebEIR`,
  description: [
    {
      language: "en",
      text: "The Submodel provides the means to access the Carbon Footprint",
    },
  ],
  displayName: [
    {
      language: "de",
      text: "CO2 Footprint",
    },
    {
      language: "en",
      text: "Carbon Footprint",
    },
  ],
  idShort: "CarbonFootprint",
  submodelElements: [
    {
      modelType: "SubmodelElementCollection",
      semanticId: {
        keys: [
          {
            type: "GlobalReference",
            value: "https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9",
          },
        ],
        type: "ExternalReference",
      },
      description: [
        {
          language: "en",
          text: "Balance of greenhouse gas emissions along the entire life cycle of a product in a defined application and in relation to a defined unit of use",
        },
      ],
      displayName: [
        {
          language: "de",
          text: "Produkt C02-Fußabdruck",
        },
        {
          language: "en",
          text: "Product carbon footprint",
        },
      ],
      idShort: "ProductCarbonFootprint_A1A3",
      value: [
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG854#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "GHG Protocol",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Standard, method for determining the greenhouse gas emissions of a product",
            },
            {
              language: "de",
              text: "Norm, Standard, Verfahren zur Ermittlung der Treibhausgas-Emissionen eines Produkts",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Folgenabschätzungsmethode / Berechnungsmethode",
            },
            {
              language: "en",
              text: "impact assessment method / calculation method",
            },
          ],
          idShort: "PCFCalculationMethod",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG855#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "2.6300",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Sum of all greenhouse gas emissions of a product according to the quantification requirements of the standard",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "CO2 eq Klimawandel",
            },
            {
              language: "en",
              text: "CO2 eq Climate Change",
            },
          ],
          idShort: "PCFCO2eq",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG856#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "piece",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity unit of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Referenzeinheit für die Berechnung",
            },
            {
              language: "en",
              text: "Reference value for calculation",
            },
          ],
          idShort: "PCFReferenceValueForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG857#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "1",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Mengenangabe für die Berechnung",
            },
            {
              language: "en",
              text: "quantity of measure for calculation",
            },
          ],
          idShort: "PCFQuantityOfMeasureForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG858#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "A1-A3",
          valueId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#07-ABZ789#001",
              },
            ],
            type: "ExternalReference",
          },
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Life cycle stages of the product according to the quantification requirements of the standard to which the PCF carbon footprint statement refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Lebenszyklusphase",
            },
            {
              language: "en",
              text: "life cycle phase",
            },
          ],
          idShort: "PCFLifeCyclePhase",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0",
              },
            ],
            type: "ExternalReference",
          },
          value: "2025-03-31",
          valueType: "xs:date",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Time at which something was first published or made available",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Veröffentlichungsdatum",
            },
            {
              language: "en",
              text: "Publication date",
            },
          ],
          idShort: "PublicationDate",
        },
        {
          modelType: "SubmodelElementCollection",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABI497#001",
              },
            ],
            type: "ExternalReference",
          },
          description: [
            {
              language: "en",
              text: "Indicates the place of hand-over of the goods",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "PCF Warenübergabeadresse",
            },
            {
              language: "en",
              text: "PCF goods address hand-over",
            },
          ],
          idShort: "PCFGoodsAddressHandover",
          value: [
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH956#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Trippstadter Strasse",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Street indication of the place of transfer of goods",
                },
              ],
              idShort: "Street",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH957#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "122",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Number for identification or differentiation of individual houses of a street",
                },
              ],
              idShort: "HouseNumber",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH958#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "67663",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Zip code of the goods transfer address",
                },
              ],
              idShort: "ZipCode",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH959#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Kaiserslautern",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Indication of the city or town of the transfer of goods",
                },
              ],
              idShort: "CityTown",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-AAO259#005",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Germany",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Country where the product is transmitted",
                },
              ],
              idShort: "Country",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH960#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "49.428006",
              valueType: "xs:float",
              idShort: "Latitude",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH961#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "7.751222",
              valueType: "xs:float",
              idShort: "Longitude",
            },
          ],
        },
        {
          modelType: "ReferenceElement",
          idShort: "PCFFactSheet",
          value: {
            keys: [
              {
                type: "GlobalReference",
                value: "http://pdf.shells.smartfactory.de/PCF_FactSheet/Truck_printed.pdf",
              },
            ],
            type: "ExternalReference",
          },
        },
      ],
    },
    {
      modelType: "SubmodelElementCollection",
      semanticId: {
        keys: [
          {
            type: "GlobalReference",
            value: "https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9",
          },
        ],
        type: "ExternalReference",
      },
      description: [
        {
          language: "en",
          text: "Balance of greenhouse gas emissions along the entire life cycle of a product in a defined application and in relation to a defined unit of use",
        },
      ],
      displayName: [
        {
          language: "de",
          text: "Produkt C02-Fußabdruck",
        },
        {
          language: "en",
          text: "Product carbon footprint",
        },
      ],
      idShort: "ProductCarbonFootprint_A4",
      value: [
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG854#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "GHG Protocol",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Standard, method for determining the greenhouse gas emissions of a product",
            },
            {
              language: "de",
              text: "Norm, Standard, Verfahren zur Ermittlung der Treibhausgas-Emissionen eines Produkts",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Folgenabschätzungsmethode / Berechnungsmethode",
            },
            {
              language: "en",
              text: "impact assessment method / calculation method",
            },
          ],
          idShort: "PCFCalculationMethod",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG855#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "2.0000",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Sum of all greenhouse gas emissions of a product according to the quantification requirements of the standard",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "CO2 eq Klimawandel",
            },
            {
              language: "en",
              text: "CO2 eq Climate Change",
            },
          ],
          idShort: "PCFCO2eq",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG856#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "piece",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity unit of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Referenzeinheit für die Berechnung",
            },
            {
              language: "en",
              text: "Reference value for calculation",
            },
          ],
          idShort: "PCFReferenceValueForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG857#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "1",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Mengenangabe für die Berechnung",
            },
            {
              language: "en",
              text: "quantity of measure for calculation",
            },
          ],
          idShort: "PCFQuantityOfMeasureForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG858#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "A4",
          valueId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#07-ABU211#001",
              },
            ],
            type: "ExternalReference",
          },
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Life cycle stages of the product according to the quantification requirements of the standard to which the PCF carbon footprint statement refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Lebenszyklusphase",
            },
            {
              language: "en",
              text: "life cycle phase",
            },
          ],
          idShort: "PCFLifeCyclePhase",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0",
              },
            ],
            type: "ExternalReference",
          },
          value: "2025-03-31",
          valueType: "xs:date",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Time at which something was first published or made available",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Veröffentlichungsdatum",
            },
            {
              language: "en",
              text: "Publication date",
            },
          ],
          idShort: "PublicationDate",
        },
        {
          modelType: "SubmodelElementCollection",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABI497#001",
              },
            ],
            type: "ExternalReference",
          },
          description: [
            {
              language: "en",
              text: "Indicates the place of hand-over of the goods",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "PCF Warenübergabeadresse",
            },
            {
              language: "en",
              text: "PCF goods address hand-over",
            },
          ],
          idShort: "PCFGoodsAddressHandover",
          value: [
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH956#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Alte Kronsbergstraße",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Street indication of the place of transfer of goods",
                },
              ],
              idShort: "Street",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH957#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "11",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Number for identification or differentiation of individual houses of a street",
                },
              ],
              idShort: "HouseNumber",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH958#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "30521",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Zip code of the goods transfer address",
                },
              ],
              idShort: "ZipCode",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH959#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Hannover",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Indication of the city or town of the transfer of goods",
                },
              ],
              idShort: "CityTown",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-AAO259#005",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Germany",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Country where the product is transmitted",
                },
              ],
              idShort: "Country",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH960#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "52.31947731917296",
              valueType: "xs:float",
              idShort: "Latitude",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH961#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "9.81000507976999",
              valueType: "xs:float",
              idShort: "Longitude",
            },
          ],
        },
      ],
    },
    {
      modelType: "SubmodelElementCollection",
      semanticId: {
        keys: [
          {
            type: "GlobalReference",
            value: "https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9",
          },
        ],
        type: "ExternalReference",
      },
      description: [
        {
          language: "en",
          text: "Balance of greenhouse gas emissions along the entire life cycle of a product in a defined application and in relation to a defined unit of use",
        },
      ],
      displayName: [
        {
          language: "de",
          text: "Produkt C02-Fußabdruck",
        },
        {
          language: "en",
          text: "Product carbon footprint",
        },
      ],
      idShort: "ProductCarbonFootprint_B5",
      value: [
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG854#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "GHG Protocol",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Standard, method for determining the greenhouse gas emissions of a product",
            },
            {
              language: "de",
              text: "Norm, Standard, Verfahren zur Ermittlung der Treibhausgas-Emissionen eines Produkts",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Folgenabschätzungsmethode / Berechnungsmethode",
            },
            {
              language: "en",
              text: "impact assessment method / calculation method",
            },
          ],
          idShort: "PCFCalculationMethod",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG855#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "4.0000",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Sum of all greenhouse gas emissions of a product according to the quantification requirements of the standard",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "CO2 eq Klimawandel",
            },
            {
              language: "en",
              text: "CO2 eq Climate Change",
            },
          ],
          idShort: "PCFCO2eq",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG856#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "piece",
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity unit of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Referenzeinheit für die Berechnung",
            },
            {
              language: "en",
              text: "Reference value for calculation",
            },
          ],
          idShort: "PCFReferenceValueForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG857#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "1",
          valueType: "xs:double",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Quantity of the product to which the PCF information on the CO2 footprint refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Mengenangabe für die Berechnung",
            },
            {
              language: "en",
              text: "quantity of measure for calculation",
            },
          ],
          idShort: "PCFQuantityOfMeasureForCalculation",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABG858#001",
              },
            ],
            type: "ExternalReference",
          },
          value: "B5",
          valueId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#07-ABV499#001",
              },
            ],
            type: "ExternalReference",
          },
          valueType: "xs:string",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Life cycle stages of the product according to the quantification requirements of the standard to which the PCF carbon footprint statement refers",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Lebenszyklusphase",
            },
            {
              language: "en",
              text: "life cycle phase",
            },
          ],
          idShort: "PCFLifeCyclePhase",
        },
        {
          modelType: "Property",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0",
              },
            ],
            type: "ExternalReference",
          },
          value: "2025-03-31",
          valueType: "xs:date",
          category: "PARAMETER",
          description: [
            {
              language: "en",
              text: "Time at which something was first published or made available",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "Veröffentlichungsdatum",
            },
            {
              language: "en",
              text: "Publication date",
            },
          ],
          idShort: "PublicationDate",
        },
        {
          modelType: "SubmodelElementCollection",
          semanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "0173-1#02-ABI497#001",
              },
            ],
            type: "ExternalReference",
          },
          description: [
            {
              language: "en",
              text: "Indicates the place of hand-over of the goods",
            },
          ],
          displayName: [
            {
              language: "de",
              text: "PCF Warenübergabeadresse",
            },
            {
              language: "en",
              text: "PCF goods address hand-over",
            },
          ],
          idShort: "PCFGoodsAddressHandover",
          value: [
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH956#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Alte Kronsbergstraße",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Street indication of the place of transfer of goods",
                },
              ],
              idShort: "Street",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH957#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "11",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Number for identification or differentiation of individual houses of a street",
                },
              ],
              idShort: "HouseNumber",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH958#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "30521",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Zip code of the goods transfer address",
                },
              ],
              idShort: "ZipCode",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH959#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Hannover",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Indication of the city or town of the transfer of goods",
                },
              ],
              idShort: "CityTown",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-AAO259#005",
                  },
                ],
                type: "ExternalReference",
              },
              value: "Germany",
              valueType: "xs:string",
              category: "PARAMETER",
              description: [
                {
                  language: "en",
                  text: "Country where the product is transmitted",
                },
              ],
              idShort: "Country",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH960#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "52.31947731917296",
              valueType: "xs:float",
              idShort: "Latitude",
            },
            {
              modelType: "Property",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "0173-1#02-ABH961#001",
                  },
                ],
                type: "ExternalReference",
              },
              value: "9.81000507976999",
              valueType: "xs:float",
              idShort: "Longitude",
            },
          ],
        },
      ],
    },
  ],
}));
