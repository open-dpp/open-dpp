import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { MongooseTestingModule } from "@open-dpp/testing";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { EmailService } from "../../email/email.service";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { Template } from "../../templates/domain/template";
import { laptopFactory } from "../../templates/fixtures/laptop.factory";
import { templateCreatePropsFactory } from "../../templates/fixtures/template.factory";
import {
  TemplateDoc,
  TemplateDocSchemaVersion,
  TemplateSchema,
} from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { UsersService } from "../../users/infrastructure/users.service";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../infrastructure/passport-template-publication.schema";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "./marketplace.application.service";

describe("marketplaceService", () => {
  let marketplaceService: MarketplaceApplicationService;
  let organizationService: OrganizationsService;
  let module: TestingModule;
  let templateService: TemplateService;
  let passportTemplateService: PassportTemplatePublicationService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        PassportTemplatePublicationService,
        MarketplaceApplicationService,
        TemplateService,
        OrganizationsService,
        UsersService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getUserById: jest.fn((userId) => {
              // Return the appropriate test user based on userId
              return TestUsersAndOrganizations.users.user1.id === userId
                ? TestUsersAndOrganizations.users.user1
                : TestUsersAndOrganizations.users.user2;
            }),
          },
        },
      ],
    }).compile();
    marketplaceService = module.get<MarketplaceApplicationService>(
      MarketplaceApplicationService,
    );
    templateService = module.get<TemplateService>(TemplateService);
    passportTemplateService = module.get<PassportTemplatePublicationService>(
      PassportTemplatePublicationService,
    );
    organizationService = module.get<OrganizationsService>(OrganizationsService);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  const laptopModelPlain = laptopFactory.build({
    organizationId: TestUsersAndOrganizations.organizations.org1.id,
    userId: TestUsersAndOrganizations.users.user1.id,
  });

  it("should upload template to marketplace", async () => {
    const template = Template.loadFromDb({
      ...laptopModelPlain,
      name: `${randomUUID()}-data-model`,
    });
    const { id } = await marketplaceService.upload(
      template,
      TestUsersAndOrganizations.users.user1,
    );
    const expected = {
      version: template.version,
      name: template.name,
      description: template.description,
      sectors: template.sectors,
      organizationName: TestUsersAndOrganizations.organizations.org1.name,
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
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: TestUsersAndOrganizations.organizations.org1.id }),
    );
    const { id } = await marketplaceService.upload(
      template,
      TestUsersAndOrganizations.users.user1,
    );
    template.marketplaceResourceId = id;
    await templateService.save(template);
    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      "findOneOrFail",
    );

    const downloadedTemplate = await marketplaceService.download(
      TestUsersAndOrganizations.organizations.org1.id,
      randomUUID(),
      template.marketplaceResourceId,
    );

    expect(downloadedTemplate).toEqual(template);
    expect(findTemplateAtMarketplace).not.toHaveBeenCalled();
  });

  it("should download template from marketplace", async () => {
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: TestUsersAndOrganizations.organizations.org1.id }),
    );
    const { id, name, version } = await marketplaceService.upload(
      template,
      TestUsersAndOrganizations.users.user1,
    );

    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      "findOneOrFail",
    );

    const productDataModel = await marketplaceService.download(
      TestUsersAndOrganizations.organizations.org1.id,
      TestUsersAndOrganizations.users.user1.id,
      id,
    );
    expect(findTemplateAtMarketplace).toHaveBeenCalledWith(id);
    expect(productDataModel).toBeInstanceOf(Template);
    expect(productDataModel.marketplaceResourceId).toEqual(id);
    expect(productDataModel.name).toEqual(name);
    expect(productDataModel.version).toEqual(version);
    expect(productDataModel.ownedByOrganizationId).toEqual(TestUsersAndOrganizations.organizations.org1.id);
    expect(productDataModel.createdByUserId).toEqual(TestUsersAndOrganizations.users.user1.id);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });
});
