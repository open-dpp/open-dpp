import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { EnvModule, EnvService } from "@open-dpp/env";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { Environment } from "../domain/environment";
import { Passport } from "../domain/passport";
import { AasRepository } from "../infrastructure/aas.repository";
import { PassportRepository } from "../infrastructure/passport.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../infrastructure/schemas/asset-administration-shell.schema";
import { PassportDoc, PassportSchema } from "../infrastructure/schemas/passport.schema";
import { SubmodelDoc, SubmodelSchema } from "../infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  let app: INestApplication;
  let authService: AuthService;
  let passportRepository: PassportRepository;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AuthModule,
        AasModule,
      ],
      providers: [
        PassportRepository,
        AasRepository,
        SubmodelRepository,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [PassportController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    await app.init();
    passportRepository = moduleRef.get<PassportRepository>(PassportRepository);
    aasRepository = moduleRef.get<AasRepository>(AasRepository);
    submodelRepository = moduleRef.get<SubmodelRepository>(SubmodelRepository);

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  const aasPlain
    = {
      modelType: "AssetAdministrationShell",
      assetInformation: {
        assetKind: "Instance",
        assetType: "product",
        defaultThumbnail: {
          contentType: "image/png",
          path: "https://raw.githubusercontent.com/SmartFactory-KL/thumbnails/refs/heads/main/truck/Truck.png",
        },
        globalAssetId: "https://smartfactory.de/assets/zm6As5rG-h",
      },
      submodels: [
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/k9u4UhbfeY",
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
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/IexIFXJ0YL",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "http://example.com/id/type/submodel/BOM/1/1",
              },
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/Truck/BillOfMaterial#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/ObSfHebEIR",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/ap3eDlX07V",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/CommercialProperties#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/2CZc64Umg5",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/DesignOfProduct#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/u-OoAXBcS9",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/MaterialData#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/FHQAji8hF7",
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
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/JYxmp8RpoK",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/Offers#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/SuccLBA6uS",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/ProductIdentification#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/vyLbhavxNR",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/QualityInformation#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/PJB9h1jH2s",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://smartfactory.de/semantics/submodel/RequestForServices#1/0",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/chpKK0Q-N7",
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
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/B5t9hU0siU",
            },
          ],
          referredSemanticId: {
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2",
              },
            ],
            type: "ExternalReference",
          },
          type: "ModelReference",
        },
        {
          keys: [
            {
              type: "Submodel",
              value: "https://smartfactory.de/submodels/7e00b513-44d1-4fb5-9779-efcdf5ed6cda",
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
          value: "de.smartfactory.product.truck",
          valueType: "xs:string",
        },
        {
          name: "isRootOfProductTree",
          value: "true",
        },
      ],
      id: "https://smartfactory.de/shells/-SR7BbncJG",
      displayName: [
        {
          language: "de",
          text: "de.smartfactory.product.truck",
        },
      ],
      idShort: "Truck",
    };

  it(`/GET shells`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    // const submodelPlain = {
    //   modelType: "Submodel",
    //   kind: "Instance",
    //   semanticId: {
    //     keys: [
    //       {
    //         type: "GlobalReference",
    //         value: "https://smartfactory.de/semantics/submodel/DesignOfProduct#1/0",
    //       },
    //     ],
    //     type: "ExternalReference",
    //   },
    //   id: "https://smartfactory.de/submodels/2CZc64Umg5",
    //   idShort: "DesignOfProduct",
    //   submodelElements: [
    //     {
    //       modelType: "SubmodelElementCollection",
    //       idShort: "Design_V01",
    //       value: [
    //         {
    //           modelType: "SubmodelElementCollection",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "Author",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           idShort: "Author",
    //           value: [
    //             {
    //               modelType: "Property",
    //               semanticId: {
    //                 keys: [
    //                   {
    //                     type: "GlobalReference",
    //                     value: "AuthorName",
    //                   },
    //                 ],
    //                 type: "ExternalReference",
    //               },
    //               value: "Fabrikvordenker:in ER28-0652",
    //               valueType: "xs:string",
    //               idShort: "AuthorName",
    //             },
    //             {
    //               modelType: "Property",
    //               semanticId: {
    //                 keys: [
    //                   {
    //                     type: "GlobalReference",
    //                     value: "AuthorOrganization",
    //                   },
    //                 ],
    //                 type: "ExternalReference",
    //               },
    //               value: "Technologie-Initiative SmartFactory KL e. V.",
    //               valueType: "xs:string",
    //               idShort: "AuthorOrganization",
    //             },
    //           ],
    //         },
    //         {
    //           modelType: "SubmodelElementCollection",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "AdditionalInformation",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           idShort: "AdditionalInformation",
    //           value: [
    //             {
    //               modelType: "Property",
    //               semanticId: {
    //                 keys: [
    //                   {
    //                     type: "GlobalReference",
    //                     value: "AuthorName",
    //                   },
    //                 ],
    //                 type: "ExternalReference",
    //               },
    //               value: "Probably _PHUCKET",
    //               valueType: "xs:string",
    //               idShort: "CreatorIsland",
    //             },
    //             {
    //               modelType: "Property",
    //               semanticId: {
    //                 keys: [
    //                   {
    //                     type: "GlobalReference",
    //                     value: "AuthorOrganization",
    //                   },
    //                 ],
    //                 type: "ExternalReference",
    //               },
    //               value: "1. Fußball-Club Kaiserslautern e. V.",
    //               valueType: "xs:string",
    //               idShort: "Aufsteiger",
    //             },
    //             {
    //               modelType: "Property",
    //               semanticId: {
    //                 keys: [
    //                   {
    //                     type: "GlobalReference",
    //                     value: "ApplicationName",
    //                   },
    //                 ],
    //                 type: "ExternalReference",
    //               },
    //               value: "https://www.youtube.com/watch?v=G1IbRujko-A",
    //               valueType: "xs:string",
    //               idShort: "MotivationalVideo",
    //             },
    //           ],
    //         },
    //         {
    //           modelType: "Property",
    //           value: "Technologie-Initiative SmartFactory KL e. V.",
    //           valueType: "xs:string",
    //           idShort: "ApplicationSource",
    //         },
    //         {
    //           modelType: "Property",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "ApplicationName",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           value: "Siemens NX",
    //           valueType: "xs:string",
    //           idShort: "ApplicationName",
    //         },
    //         {
    //           modelType: "Property",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "ModelDescription",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           value: "prt",
    //           valueType: "xs:string",
    //           idShort: "ModelDescription",
    //         },
    //         {
    //           modelType: "Property",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "ModelType",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           value: "CAD",
    //           valueType: "xs:string",
    //           idShort: "ModelType",
    //         },
    //         {
    //           modelType: "Property",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "ModelFileVersion",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           value: "V1.0",
    //           valueType: "xs:string",
    //           idShort: "ModelFileVersion",
    //         },
    //         {
    //           modelType: "Property",
    //           semanticId: {
    //             keys: [
    //               {
    //                 type: "GlobalReference",
    //                 value: "ModelName",
    //               },
    //             ],
    //             type: "ExternalReference",
    //           },
    //           value: "Truck",
    //           valueType: "xs:string",
    //           idShort: "ModelName",
    //         },
    //       ],
    //     },
    //   ],
    // };
    // const submodelToSave = Submodel.fromPlain(submodelPlain);
    // const submodel = await submodelRepository.save(submodelToSave);

    const aas = AssetAdministrationShell.fromPlain(aasPlain);
    await aasRepository.save(aas);

    const passport = Passport.create({
      id: randomUUID(),
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await passportRepository.save(passport);

    const response = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/passports/${passport.id}/shells`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(aas.id);
    expect(response.body.result).toEqual([aas.toPlain()]);
  });

  afterAll(async () => {
    await app.close();
  });
});
