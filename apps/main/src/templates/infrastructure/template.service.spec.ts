import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { Template } from '../domain/template';
import { randomUUID } from 'crypto';
import { Connection, Model as MongooseModel } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  TemplateDoc,
  TemplateDocSchemaVersion,
  TemplateSchema,
} from './template.schema';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { KeycloakResourcesModule } from '../../keycloak-resources/keycloak-resources.module';
import { templateCreatePropsFactory } from '../fixtures/template.factory';
import { laptopFactory } from '../fixtures/laptop.factory';
import { sectionDbPropsFactory } from '../fixtures/section.factory';
import { SectionType } from '../../data-modelling/domain/section-base';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { expect } from '@jest/globals';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

describe('TemplateService', () => {
  let service: TemplateService;
  const userId = randomUUID();
  const organizationId = randomUUID();
  let mongoConnection: Connection;
  let module: TestingModule;
  let templateDoc: MongooseModel<TemplateDoc>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        KeycloakResourcesModule,
      ],
      providers: [TemplateService],
    }).compile();
    service = module.get<TemplateService>(TemplateService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    templateDoc = mongoConnection.model(TemplateDoc.name, TemplateSchema);
  });

  const laptopModelPlain = laptopFactory.build({
    organizationId,
    userId,
  });

  it('fails if requested template could not be found', async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Template.name),
    );
  });

  it('should create template', async () => {
    const template = Template.loadFromDb({
      ...laptopModelPlain,
    });

    const { id } = await service.save(template);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(template);
  });

  it('finds template by marketplaceResourceId', async () => {
    const laptop = Template.loadFromDb(laptopModelPlain);
    const marketplaceResourceId = randomUUID();
    laptop.assignMarketplaceResource(marketplaceResourceId);
    await service.save(laptop);

    const otherOrganizationId = randomUUID();
    const laptopOtherOrganization = Template.loadFromDb(
      laptopFactory.build({
        organizationId: otherOrganizationId,
        userId: randomUUID(),
      }),
    );
    laptopOtherOrganization.assignMarketplaceResource(marketplaceResourceId);
    await service.save(laptopOtherOrganization);

    let found = await service.findByMarketplaceResource(
      organizationId,
      marketplaceResourceId,
    );
    expect(found).toEqual(laptop);

    found = await service.findByMarketplaceResource(
      otherOrganizationId,
      marketplaceResourceId,
    );
    expect(found).toEqual(laptopOtherOrganization);
  });

  it('sets correct default granularity level', async () => {
    const laptopModel = laptopFactory.build({
      sections: [
        sectionDbPropsFactory.build({
          name: 'Environment',
          granularityLevel: undefined,
        }),
        sectionDbPropsFactory.build({
          type: SectionType.REPEATABLE,
          name: 'Materials',
          granularityLevel: undefined,
        }),
      ],
    });

    const template = Template.loadFromDb(laptopModel);
    const { id } = await service.save(template);
    const found = await service.findOneOrFail(id);
    expect(found.sections[0].granularityLevel).toBeUndefined();
    expect(found.sections[1].granularityLevel).toEqual(GranularityLevel.MODEL);
  });

  it('should return templates by name', async () => {
    const template = Template.loadFromDb({
      ...laptopModelPlain,
      name: `${randomUUID()}-data-model`,
    });

    await service.save(template);
    const found = await service.findByName(template.name);
    expect(found).toEqual([
      {
        id: template.id,
        name: template.name,
        version: template.version,
      },
    ]);
  });

  it('should return all templates belonging to organization', async () => {
    const laptopModel = Template.loadFromDb({
      ...laptopModelPlain,
    });
    const phoneModel = Template.loadFromDb({
      ...laptopModelPlain,
      id: randomUUID(),
      name: 'phone',
    });
    const otherOrganizationId = randomUUID();
    const privateModel = Template.create(
      templateCreatePropsFactory.build({
        name: 'privateModel',
        organizationId: otherOrganizationId,
      }),
    );
    await service.save(laptopModel);
    await service.save(phoneModel);
    await service.save(privateModel);

    const foundAll = await service.findAllByOrganization(organizationId);

    expect(foundAll).toContainEqual({
      id: laptopModel.id,
      name: laptopModel.name,
      version: laptopModel.version,
      description: laptopModel.description,
      sectors: laptopModel.sectors,
    });
    expect(foundAll).toContainEqual({
      id: phoneModel.id,
      name: phoneModel.name,
      version: phoneModel.version,
      description: phoneModel.description,
      sectors: phoneModel.sectors,
    });
    expect(foundAll).not.toContainEqual({
      id: privateModel.id,
      name: privateModel.name,
      version: privateModel.version,
      description: privateModel.description,
      sectors: privateModel.sectors,
    });
  });

  it(`should migrate from smaller equal ${TemplateDocSchemaVersion.v1_0_2} to ${TemplateDocSchemaVersion.v1_0_3}`, async () => {
    const id = randomUUID();
    await templateDoc.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          _schemaVersion: TemplateDocSchemaVersion.v1_0_2,
          name: 'name',
          version: '1.0.0',
          createdByUserId: randomUUID(),
          ownedByOrganizationId: randomUUID(),
          sections: [
            {
              _id: randomUUID(),
              name: 's1',
              type: SectionType.GROUP,
              layout: {
                colSpan: {
                  sm: 1,
                },
                colStart: {
                  sm: 1,
                },
                rowStart: {
                  sm: 1,
                },
                rowSpan: {
                  sm: 1,
                },
                cols: {
                  sm: 1,
                },
              },
              dataFields: [
                {
                  _id: randomUUID(),
                  name: 'f1',
                  type: DataFieldType.TEXT_FIELD,
                  granularityLevel: GranularityLevel.MODEL,
                  layout: {
                    colSpan: {
                      sm: 1,
                    },
                    colStart: {
                      sm: 1,
                    },
                    rowStart: {
                      sm: 1,
                    },
                    rowSpan: {
                      sm: 1,
                    },
                  },
                },
              ],
              subSections: [],
            },
          ],
        },
      },
      { upsert: true },
    );
    let foundRaw = await templateDoc.findById(id);
    expect(foundRaw).toBeDefined();
    if (foundRaw) {
      expect(foundRaw.sections[0].layout).toBeDefined();
      expect(foundRaw.sections[0].dataFields[0].layout).toBeDefined();
      const found = await service.findOneOrFail(id);
      const saved = await service.save(found);
      foundRaw = await templateDoc.findById(saved.id);
      if (foundRaw) {
        expect(foundRaw._schemaVersion).toEqual(
          TemplateDocSchemaVersion.v1_0_3,
        );
        expect(foundRaw.sections[0].layout).toBeUndefined();
        expect(foundRaw.sections[0].dataFields[0].layout).toBeUndefined();
      }
    }
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
