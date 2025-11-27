import { expect } from "@jest/globals";
import { z } from "zod";
import { DataTypeDef } from "../common/data-type-def";
import { SubmodelBaseUnionSchema } from "./aas-json-schemas";

describe("zod-schemas", () => {
  it("should parse discriminated union correctly", () => {
    const schema = z.object({
      submodels: SubmodelBaseUnionSchema.array(),
    });

    const submodels = [
      {
        modelType: "Property",
        idShort: "test",
        valueType: DataTypeDef.Double,
      },
      {
        modelType: "Entity",
        entityType: "CoManagedEntity",
        statements: [
          {
            modelType: "Entity",
            entityType: "CoManagedEntity",
            statements: [
              {
                modelType: "Property",
                value: "http://shells.smartfactory.de/aHR0cHM6Ly9zbWFydGZhY3RvcnkuZGUvc2hlbGxzLy1TUjdCYm5jSkc",
                valueType: "xs:string",
                category: "CONSTANT",
                description: [
                  {
                    language: "en",
                    text: "URL of the application",
                  },
                  {
                    language: "de",
                    text: "URL der Anwendung",
                  },
                ],
                idShort: "ApplicationURL",
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
            description: [
              {
                language: "en",
                text: "SmartFactoryKL ShellScape",
              },
              {
                language: "de",
                text: "SmartFactoryKL ShellScape",
              },
            ],
            idShort: "SmartFactoryShellScape",
          },
          {
            modelType: "Entity",
            entityType: "CoManagedEntity",
            statements: [
              {
                modelType: "Property",
                value: "https://oncite.apps.c01.demo.oncite.io/core/productionview/#/workorder",
                valueType: "xs:string",
                category: "CONSTANT",
                description: [
                  {
                    language: "en",
                    text: "URL of the application",
                  },
                  {
                    language: "de",
                    text: "URL der Anwendung",
                  },
                ],
                idShort: "ApplicationURL",
              },
              {
                modelType: "Property",
                value: "https://oncite.apps.c01.demo.oncite.io/hmi/#/workorder-list",
                valueType: "xs:string",
                category: "CONSTANT",
                description: [
                  {
                    language: "en",
                    text: "URL of the digital production system hmi client",
                  },
                  {
                    language: "de",
                    text: "URL des HMI Clients des digitalen Produktionssystem",
                  },
                ],
                idShort: "HMI_Client",
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
            description: [
              {
                language: "en",
                text: "DigitalProductionSystem (German Edge Cloud)",
              },
              {
                language: "de",
                text: "DigitalProductionSystem (German Edge Cloud)",
              },
            ],
            idShort: "DigitalProductionSystem",
          },
        ],
        semanticId: {
          keys: [
            {
              type: "GlobalReference",
              value: "https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0",
            },
          ],
          type: "ExternalReference",
        },
        idShort: "BillOfApplications",
      },
    ];

    const parsed = schema.safeParse({
      submodels,
    });
    expect(parsed.success).toBeTruthy();
  });
});
