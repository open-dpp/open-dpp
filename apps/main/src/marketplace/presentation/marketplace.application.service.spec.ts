import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { Template } from "../../templates/domain/template";
import { laptopFactory } from "../../templates/fixtures/laptop.factory";
import { templateCreatePropsFactory } from "../../templates/fixtures/template.factory";
import {
  TemplateDoc,
  TemplateDocSchemaVersion,
  TemplateSchema,
} from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../infrastructure/passport-template-publication.schema";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "./marketplace.application.service";

describe("marketplaceService", () => {
  let app: INestApplication;
  let marketplaceService: MarketplaceApplicationService;
  let module: TestingModule;
  let templateService: TemplateService;
  let passportTemplateService: PassportTemplatePublicationService;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        PassportTemplatePublicationService,
        MarketplaceApplicationService,
        TemplateService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();
    marketplaceService = module.get<MarketplaceApplicationService>(
      MarketplaceApplicationService,
    );
    templateService = module.get<TemplateService>(TemplateService);
    passportTemplateService = module.get<PassportTemplatePublicationService>(
      PassportTemplatePublicationService,
    );
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it("should upload template to marketplace", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModelPlain = laptopFactory.build({
      organizationId: org.id,
      userId: user.id,
    });
    const template = Template.loadFromDb({
      ...laptopModelPlain,
      name: `${randomUUID()}-data-model`,
    });
    const { id } = await marketplaceService.upload(
      template,
      user,
      org.id,
      org.name,
    );
    const expected = {
      version: template.version,
      name: template.name,
      description: template.description,
      sectors: template.sectors,
      organizationName: org.name,
    };
    const foundUpload = await passportTemplateService.findOneOrFail(id);
    expect(foundUpload.templateData).toEqual({
      _id: template.id,
      name: template.name,
      description: template.description,
      sectors: template.sectors,
      version: template.version,
      _schemaVersion: TemplateDocSchemaVersion.v1_0_3,
      sections: template.sections.map(s => ({
        _id: s.id,
        name: s.name,
        type: s.type,
        granularityLevel: s.granularityLevel,
        dataFields: s.dataFields.map(d => ({
          _id: d.id,
          name: d.name,
          type: d.type,
          options: d.options,
          granularityLevel: d.granularityLevel,
        })),
        subSections: s.subSections,
        parentId: s.parentId,
      })),
      createdByUserId: template.createdByUserId,
      ownedByOrganizationId: template.ownedByOrganizationId,
      marketplaceResourceId: template.marketplaceResourceId,
    });
    expect(foundUpload.version).toEqual(expected.version);
    expect(foundUpload.name).toEqual(expected.name);
    expect(foundUpload.description).toEqual(expected.description);
    expect(foundUpload.sectors).toEqual(expected.sectors);
    expect(foundUpload.organizationName).toEqual(expected.organizationName);
  });

  it("should return already downloaded template instead of fetching it from the marketplace", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: org.id }),
    );
    const { id } = await marketplaceService.upload(
      template,
      user,
      org.id,
      org.name,
    );
    template.marketplaceResourceId = id;
    await templateService.save(template);
    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      "findOneOrFail",
    );

    const downloadedTemplate = await marketplaceService.download(
      org.id,
      randomUUID(),
      template.marketplaceResourceId,
    );

    expect(downloadedTemplate).toEqual(template);
    expect(findTemplateAtMarketplace).not.toHaveBeenCalled();
  });

  it("should download template from marketplace", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: org.id }),
    );
    const { id, name, version } = await marketplaceService.upload(
      template,
      user,
      org.id,
      org.name,
    );

    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      "findOneOrFail",
    );

    const productDataModel = await marketplaceService.download(
      org.id,
      user.id,
      id,
    );
    expect(findTemplateAtMarketplace).toHaveBeenCalledWith(id);
    expect(productDataModel).toBeInstanceOf(Template);
    expect(productDataModel.marketplaceResourceId).toEqual(id);
    expect(productDataModel.name).toEqual(name);
    expect(productDataModel.version).toEqual(version);
    expect(productDataModel.ownedByOrganizationId).toEqual(org.id);
    expect(productDataModel.createdByUserId).toEqual(user.id);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });
});
