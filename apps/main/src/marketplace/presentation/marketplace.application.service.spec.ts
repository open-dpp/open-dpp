import { Test, TestingModule } from '@nestjs/testing';
import { Template } from '../../templates/domain/template';
import { randomUUID } from 'crypto';
import {
  TemplateDoc,
  TemplateDocSchemaVersion,
  TemplateSchema,
} from '../../templates/infrastructure/template.schema';
import { OrganizationsService } from '../../organizations/infrastructure/organizations.service';
import { Organization } from '../../organizations/domain/organization';
import { User } from '../../users/domain/user';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../organizations/infrastructure/organization.entity';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { KeycloakResourcesModule } from '../../keycloak-resources/keycloak-resources.module';
import { UsersService } from '../../users/infrastructure/users.service';
import { MarketplaceApplicationService } from './marketplace.application.service';
import { DataSource } from 'typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { laptopFactory } from '../../templates/fixtures/laptop.factory';
import { TemplateService } from '../../templates/infrastructure/template.service';
import { templateCreatePropsFactory } from '../../templates/fixtures/template.factory';
import { expect, jest } from '@jest/globals';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import {
  PassportTemplateDbSchema,
  PassportTemplateDoc,
} from '../infrastructure/passport-template.schema';

describe('MarketplaceService', () => {
  let marketplaceService: MarketplaceApplicationService;
  const userId = randomUUID();
  const organizationId = randomUUID();
  let organizationService: OrganizationsService;
  let module: TestingModule;
  let dataSource: DataSource;
  let templateService: TemplateService;
  let passportTemplateService: PassportTemplateService;
  let organization: Organization;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplateDoc.name,
            schema: PassportTemplateDbSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        KeycloakResourcesModule,
      ],
      providers: [
        PassportTemplateService,
        MarketplaceApplicationService,
        OrganizationsService,
        UsersService,
        TemplateService,
      ],
    }).compile();
    marketplaceService = module.get<MarketplaceApplicationService>(
      MarketplaceApplicationService,
    );
    templateService = module.get<TemplateService>(TemplateService);
    passportTemplateService = module.get<PassportTemplateService>(
      PassportTemplateService,
    );
    organizationService =
      module.get<OrganizationsService>(OrganizationsService);
    organization = await organizationService.save(
      Organization.fromPlain({
        id: organizationId,
        name: 'orga name',
        members: [new User(userId, `${userId}@example.com`)],
        createdByUserId: userId,
        ownedByUserId: userId,
      }),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  const laptopModelPlain = laptopFactory.build({
    organizationId,
    userId,
  });

  it('should upload template to marketplace', async () => {
    const template = Template.loadFromDb({
      ...laptopModelPlain,
      name: `${randomUUID()}-data-model`,
    });
    const { id } = await marketplaceService.upload(
      template,
      User.create({ id: randomUUID(), email: 'test@example.com' }),
    );
    const expected = {
      version: template.version,
      name: template.name,
      description: template.description,
      sectors: template.sectors,
      organizationName: organization.name,
    };
    const foundUpload = await passportTemplateService.findOneOrFail(id);
    expect(foundUpload.templateData).toEqual({
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
    });
    expect(foundUpload.version).toEqual(expected.version);
    expect(foundUpload.name).toEqual(expected.name);
    expect(foundUpload.description).toEqual(expected.description);
    expect(foundUpload.sectors).toEqual(expected.sectors);
    expect(foundUpload.organizationName).toEqual(expected.organizationName);
  });

  it('should return already downloaded template instead of fetching it from the marketplace', async () => {
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: organizationId }),
    );
    const { id } = await marketplaceService.upload(
      template,
      User.create({ id: randomUUID(), email: 'test@example.com' }),
    );
    template.marketplaceResourceId = id;
    await templateService.save(template);
    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      'findOneOrFail',
    );

    const downloadedTemplate = await marketplaceService.download(
      organizationId,
      randomUUID(),
      template.marketplaceResourceId,
    );

    expect(downloadedTemplate).toEqual(template);
    expect(findTemplateAtMarketplace).not.toHaveBeenCalled();
  });

  it('should download template from marketplace', async () => {
    const template = Template.create(
      templateCreatePropsFactory.build({ organizationId: organizationId }),
    );
    const userId = randomUUID();
    const { id, name, version } = await marketplaceService.upload(
      template,
      User.create({ id: userId, email: 'test@example.com' }),
    );

    const findTemplateAtMarketplace = jest.spyOn(
      passportTemplateService,
      'findOneOrFail',
    );

    const productDataModel = await marketplaceService.download(
      organizationId,
      userId,
      id,
    );
    expect(findTemplateAtMarketplace).toHaveBeenCalledWith(id);
    expect(productDataModel).toBeInstanceOf(Template);
    expect(productDataModel.marketplaceResourceId).toEqual(id);
    expect(productDataModel.name).toEqual(name);
    expect(productDataModel.version).toEqual(version);
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
