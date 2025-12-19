import { SubmodelJsonSchema } from "@open-dpp/dto";
import { Factory } from "fishery";
import { z } from "zod";

interface SubmodelTransientParams {
  iriDomain: string;
}
type Input = z.infer<typeof SubmodelJsonSchema>;
export const submodelDesignOfProductPlainFactory
  = Factory.define<Partial<Input>, SubmodelTransientParams> (({ transientParams }) => (
    {
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
                {
                  modelType: "SubmodelElementList",
                  idShort: "ListProp",
                  orderRelevant: false,
                  typeValueListElement: "SubmodelElementCollection",
                  value: [
                    {
                      modelType: "SubmodelElementCollection",
                      idShort: "el1",
                      value: [
                        {
                          modelType: "Property",
                          value: "val1",
                          valueType: "xs:string",
                          idShort: "prop1",
                        },
                      ],
                    },
                    {
                      modelType: "SubmodelElementCollection",
                      idShort: "el2",
                      value: [
                        {
                          modelType: "Property",
                          value: "val2",
                          valueType: "xs:string",
                          idShort: "prop2",
                        },
                      ],
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
                  modelType: "Blob",
                  contentType: "text/rtf",
                  // value: "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2822\n\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}\n{\\colortbl;\\red255\\green255\\blue255;}\n{\\*\\expandedcolortbl;;}\n\\paperw11900\\paperh16840\\margl1440\\margr1440\\vieww11520\\viewh8400\\viewkind0\n\\pard\\tx720\\tx1440\\tx2160\\tx2880\\tx3600\\tx4320\\tx5040\\tx5760\\tx6480\\tx7200\\tx7920\\tx8640\\pardirnatural\\partightenfactor0\n\n\\f0\\fs24 \\cf0 test}",
                  value: "e1xydGYxXGFuc2lcYW5zaWNwZzEyNTJcY29jb2FydGYyODIyClxjb2NvYXRleHRzY2FsaW5nMFxjb2NvYXBsYXRmb3JtMHtcZm9udHRibFxmMFxmc3dpc3NcZmNoYXJzZXQwIEhlbHZldGljYTt9CntcY29sb3J0Ymw7XHJlZDI1NVxncmVlbjI1NVxibHVlMjU1O30Ke1wqXGV4cGFuZGVkY29sb3J0Ymw7O30KXHBhcGVydzExOTAwXHBhcGVyaDE2ODQwXG1hcmdsMTQ0MFxtYXJncjE0NDBcdmlld3cxMTUyMFx2aWV3aDg0MDBcdmlld2tpbmQwClxwYXJkXHR4NzIwXHR4MTQ0MFx0eDIxNjBcdHgyODgwXHR4MzYwMFx0eDQzMjBcdHg1MDQwXHR4NTc2MFx0eDY0ODBcdHg3MjAwXHR4NzkyMFx0eDg2NDBccGFyZGlybmF0dXJhbFxwYXJ0aWdodGVuZmFjdG9yMAoKXGYwXGZzMjQgXGNmMCB0ZXN0fQ==",
                  idShort: "BlobProp",
                },
                {
                  modelType: "File",
                  contentType: "image/jpeg",
                  value: "aHR-Design_V01.Author.FileProp.jpg",
                  idShort: "FileProp",
                },
                {
                  modelType: "Range",
                  max: "20",
                  min: "4",
                  valueType: "xs:string",
                  idShort: "RangeProp",
                },
                {
                  modelType: "MultiLanguageProperty",
                  value: [
                    {
                      language: "de",
                      text: "Schnelle Übersicht",
                    },
                    {
                      language: "en",
                      text: "Quick Overview",
                    },
                  ],
                  idShort: "MultilanguageProp",
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

export const submodelCarbonFootprintPlainFactory = Factory.define<any, SubmodelTransientParams>(({ transientParams }) => ({
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

export const submodelBillOfMaterialPlainFactory
  = Factory.define<Partial<Input>, SubmodelTransientParams> (({ transientParams }) => (
    {
      modelType: "Submodel",
      kind: "Instance",
      semanticId: {
        keys: [
          {
            type: "GlobalReference",
            value: "http://example.com/id/type/submodel/BOM/1/1",
          },
          {
            type: "GlobalReference",
            value: `${transientParams.iriDomain}/semantics/submodel/Truck/BillOfMaterial#1/0`,
          },
        ],
        type: "ExternalReference",
      },
      id: `${transientParams.iriDomain}/submodels/IexIFXJ0YL`,
      idShort: "BillOfMaterial",
      submodelElements: [
        {
          modelType: "Entity",
          entityType: "SelfManagedEntity",
          globalAssetId: `${transientParams.iriDomain}/assets/zm6As5rG-h`,
          statements: [
            {
              modelType: "Property",
              value: `${transientParams.iriDomain}/shells/-SR7BbncJG`,
              valueType: "xs:string",
              idShort: "Id",
            },
            {
              modelType: "ReferenceElement",
              idShort: "URL",
              value: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: `${transientParams.iriDomain}/shells/-SR7BbncJG`,
                  },
                ],
                type: "ExternalReference",
              },
            },
            {
              modelType: "Entity",
              entityType: "SelfManagedEntity",
              globalAssetId: `${transientParams.iriDomain}/assets/aYJwzLG1RF`,
              statements: [
                {
                  modelType: "Property",
                  value: `${transientParams.iriDomain}/shells/wpIL8kYawf`,
                  valueType: "xs:string",
                  idShort: "Id",
                },
                {
                  modelType: "Entity",
                  entityType: "SelfManagedEntity",
                  globalAssetId: `${transientParams.iriDomain}/assets/XjUPRWkSw5`,
                  idShort: "Lid",
                  statements: [
                    {
                      modelType: "Property",
                      value: "Lid_A_Blue",
                      valueType: "xs:string",
                      idShort: "Name",
                    },
                  ],
                  semanticId: {
                    keys: [
                      {
                        type: "GlobalReference",
                        value: "https://admin-shell.io/idta/HierarchicalStructures/Node/1/0",
                      },
                    ],
                    type: "ExternalReference",
                  },
                  qualifiers: [
                    {
                      semanticId: {
                        keys: [
                          {
                            type: "GlobalReference",
                            value: "https://admin-shell.io/SubmodelTemplates/Cardinality/1/0",
                          },
                        ],
                        type: "ExternalReference",
                      },
                      kind: "ConceptQualifier",
                      type: "SMT/Cardinality",
                      value: "One",
                      valueType: "xs:string",
                    },
                  ],
                },
              ],
              idShort: "Semitrailer",
            },
            {
              modelType: "RelationshipElement",
              semanticId: {
                keys: [
                  {
                    type: "GlobalReference",
                    value: "https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0",
                  },
                ],
                type: "ExternalReference",
              },
              qualifiers: [
                {
                  semanticId: {
                    keys: [
                      {
                        type: "GlobalReference",
                        value: "https://admin-shell.io/SubmodelTemplates/Cardinality/1/0",
                      },
                    ],
                    type: "ExternalReference",
                  },
                  kind: "ConceptQualifier",
                  type: "SMT/Cardinality",
                  value: "ZeroToMany",
                  valueType: "xs:string",
                },
                {
                  kind: "ValueQualifier",
                  type: "EditIdShort",
                  value: "True",
                  valueType: "xs:string",
                },
              ],
              description: [
                {
                  language: "en",
                  text: "Modeling of logical connections between components and sub-components. Either this or \"IsPartOf\" must be used, not both.",
                },
              ],
              idShort: "HasPart0001",
              first: {
                keys: [
                  {
                    type: "Submodel",
                    value: `${transientParams.iriDomain}/submodels/IexIFXJ0YL`,
                  },
                  {
                    type: "Entity",
                    value: "Truck",
                  },
                ],
                type: "ModelReference",
              },
              second: {
                keys: [
                  {
                    type: "Submodel",
                    value: `${transientParams.iriDomain}/submodels/IexIFXJ0YL`,
                  },
                  {
                    type: "Entity",
                    value: "Truck",
                  },
                  {
                    type: "Entity",
                    value: "Semitrailer",
                  },
                ],
                type: "ModelReference",
              },
            },
          ],
          specificAssetIds: [
            {
              name: "testi",
              value: "val1",
            },
          ],
          idShort: "Truck",
        },
      ],
    }));
