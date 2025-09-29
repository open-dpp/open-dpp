import { Test, TestingModule } from '@nestjs/testing';
import { Template } from '../templates/domain/template';
import { randomUUID } from 'crypto';
import {
  TemplateDoc,
  TemplateDocSchemaVersion,
  TemplateSchema,
} from '../templates/infrastructure/template.schema';
import { PassportTemplateCreateDto } from '@open-dpp/api-client';
import { OrganizationsService } from '../organizations/infrastructure/organizations.service';
import { Organization } from '../organizations/domain/organization';
import { User } from '../users/domain/user';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../organizations/infrastructure/organization.entity';
import { UserEntity } from '../users/infrastructure/user.entity';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { UsersService } from '../users/infrastructure/users.service';
import { MarketplaceService } from './marketplace.service';
import { DataSource } from 'typeorm';
import {
  passportTemplateDtoFactory,
  templateDataFactory,
} from './fixtures/passport.template.factory';
import { MongooseModule } from '@nestjs/mongoose';
import { laptopFactory } from '../templates/fixtures/laptop.factory';
import { TemplateService } from '../templates/infrastructure/template.service';
import { templateCreatePropsFactory } from '../templates/fixtures/template.factory';
import { expect, jest } from '@jest/globals';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { AxiosResponse } from 'axios';
import type * as ApiClientModule from '@open-dpp/api-client';
type ApiClientResponse = Promise<Pick<AxiosResponse, 'data'>>;
const mockCreatePassportTemplateInMarketplace =
  jest.fn<(data: PassportTemplateCreateDto) => ApiClientResponse>();
const mockGetPassportTemplateInMarketplace =
  jest.fn<(id: string) => ApiClientResponse>();
const mockSetActiveOrganizationId = jest.fn();
const mockSetApiKey = jest.fn();

jest.mock('@open-dpp/api-client', () => {
  const actualModule = jest.requireActual<typeof ApiClientModule>(
    '@open-dpp/api-client',
  );
  return {
    ...actualModule,
    MarketplaceApiClient: jest.fn().mockImplementation(() => ({
      setActiveOrganizationId: mockSetActiveOrganizationId,
      setApiKey: mockSetApiKey,
      passportTemplates: {
        create: mockCreatePassportTemplateInMarketplace,
        getById: mockGetPassportTemplateInMarketplace,
      },
    })),
  };
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  const userId = randomUUID();
  const organizationId = randomUUID();
  let organizationService: OrganizationsService;
  let module: TestingModule;
  let dataSource: DataSource;
  let templateService: TemplateService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        KeycloakResourcesModule,
      ],
      providers: [
        MarketplaceService,
        OrganizationsService,
        UsersService,
        TemplateService,
      ],
    }).compile();
    service = module.get<MarketplaceService>(MarketplaceService);
    templateService = module.get<TemplateService>(TemplateService);
    organizationService =
      module.get<OrganizationsService>(OrganizationsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  const laptopModelPlain = laptopFactory.build({
    organizationId,
    userId,
  });

  it('should upload template to marketplace', async () => {
    const organization = await organizationService.save(
      Organization.fromPlain({
        id: organizationId,
        name: 'orga name',
        members: [new User(userId, `${userId}@example.com`)],
        createdByUserId: userId,
        ownedByUserId: userId,
      }),
    );
    const template = Template.loadFromDb({
      ...laptopModelPlain,
      name: `${randomUUID()}-data-model`,
    });
    mockCreatePassportTemplateInMarketplace.mockResolvedValue({
      data: { id: randomUUID() },
    });
    const token = randomUUID();
    await service.upload(template, token);
    expect(mockSetActiveOrganizationId).toHaveBeenCalledWith(organizationId);
    expect(mockSetApiKey).toHaveBeenCalledWith(token);
    const expected: PassportTemplateCreateDto = {
      version: template.version,
      name: template.name,
      description: template.description,
      sectors: template.sectors,
      organizationName: organization.name,
      templateData: {
        _id: template.id,
        name: template.name,
        description: template.description,
        sectors: template.sectors,
        version: template.version,
        _schemaVersion: TemplateDocSchemaVersion.v1_0_3,
        sections: template.sections.map((s) => ({
          _id: s.id,
          name: s.name,
          type: s.type,
          granularityLevel: s.granularityLevel,
          dataFields: s.dataFields.map((d) => ({
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
      },
    };
    expect(mockCreatePassportTemplateInMarketplace).toHaveBeenCalledWith(
      expected,
    );
  });

  it('should return already downloaded template instead of fetching it from the marketplace', async () => {
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: organizationId }),
    );
    template.assignMarketplaceResource('marketplaceResourceId');
    await templateService.save(template);
    const downloadedTemplate = await service.download(
      organizationId,
      randomUUID(),
      'marketplaceResourceId',
    );
    expect(downloadedTemplate).toEqual(template);
    expect(mockGetPassportTemplateInMarketplace).not.toHaveBeenCalled();
  });

  it('should download template from marketplace', async () => {
    const passportTemplateDto = passportTemplateDtoFactory.build({
      templateData: templateDataFactory.build({
        createdByUserId: randomUUID(),
        ownedByOrganizationId: randomUUID(),
      }),
    });
    mockGetPassportTemplateInMarketplace.mockResolvedValue({
      data: passportTemplateDto,
    });
    const organizationId = randomUUID();
    const userId = randomUUID();
    const productDataModel = await service.download(
      organizationId,
      userId,
      passportTemplateDto.id,
    );
    expect(mockGetPassportTemplateInMarketplace).toHaveBeenCalledWith(
      passportTemplateDto.id,
    );
    expect(productDataModel).toBeInstanceOf(Template);
    expect(productDataModel.marketplaceResourceId).toEqual(
      passportTemplateDto.id,
    );
    expect(productDataModel.name).toEqual(
      passportTemplateDto.templateData.name,
    );
    expect(productDataModel.version).toEqual(
      passportTemplateDto.templateData.version,
    );
    expect(productDataModel.ownedByOrganizationId).toEqual(organizationId);
    expect(productDataModel.createdByUserId).toEqual(userId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });
});
