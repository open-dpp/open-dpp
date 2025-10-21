import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { MongooseTestingModule } from "@open-dpp/testing";
import { Connection } from "mongoose";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AasService } from "./aas.service";
import { AiConfigurationDbSchema } from "./ai-configuration.schema";

describe("aiConfigurationService", () => {
  let aasService: AasService;
  let mongoConnection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: AasService.name,
            schema: AiConfigurationDbSchema,
          },
        ]),
      ],
      providers: [AasService],
    }).compile();
    aasService = module.get<AasService>(AasService);
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it("should save AssetAdministrationShell", async () => {
    const assetAdministrationShell = AssetAdministrationShell.create({
      modelType: "AssetAdministrationShell",
      assetInformation: {
        assetKind: "Instance",
        assetType: "product",
        defaultThumbnail: {
          contentType: "image/png",
          path: "https://raw.githubusercontent.com/SmartFactory-KL/thumbnails/refs/heads/main/truck/Semitrailer_Truck.png",
        },
        globalAssetId: "https://smartfactory.de/assets/IOCfi865tY",
      },
      submodels: [
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/YiZjS_t_Xg",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://xitaso.com/BillOfApplications",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/M5X4ZslaH1",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "http://example.com/id/type/submodel/BOM/1/1",
              },
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/Truck/BillOfMaterial#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/Cg9PVq1AgI",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9",
              },
            ],
            type: "ModelReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/7TRL2uFN93",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/CommercialProperties#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/m1O13IqFyH",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/DesignOfProduct#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/w4JAdW02Ga",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/MaterialData#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/YpPUkkCEhg",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/idta/nameplate/3/0/Nameplate",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/pvLSxs4bNF",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/Offers#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/khfWv16Cjo",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/ProductIdentification#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/h6_pBOi0i2",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/QualityInformation#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/CmLK26QhnH",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/RequestForServices#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/BRbvIRQyVE",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/CapabilityDescription#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/ukQILNDThA",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2",
              },
            ],
            type: "ModelReference",
          },
          type: "ExternalReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/8082894a-78e9-4f53-949d-9c4fb911ef0c",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "Submodel",
                value: "https://smartfactory.de/semantics/submodel/ProductionPlan#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
      ],
      extensions: [
        {
          name: "namespace",
          value: "Product",
          valueType: "xs:string",
        },
        {
          name: "shellViewId",
          value: "de.smartfactory.shell-view-id.production-plan-view",
          valueType: "xs:string",
        },
        {
          name: "sfProductId",
          value: "n/a",
          valueType: "xs:string",
        },
        {
          name: "sfProductClassId",
          value: "de.smartfactory.product.truck.cab-combination",
          valueType: "xs:string",
        },
      ],
      id: "https://smartfactory.de/shells/-8zpqJPWtC",
      displayName: [
        {
          language: "de",
          text: "de.smartfactory.product.truck.cab-combination",
        },
      ],
      idShort: "Semitrailer_Truck",

    });

    const { id } = await aasService.save(aiConfiguration);
    const found = await aasService.findOneOrFail(id);
    expect(found).toEqual(aiConfiguration);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
