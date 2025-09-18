import { Test, TestingModule } from '@nestjs/testing';
import { ModelsService } from './models.service';
import { randomUUID } from 'crypto';
import { Template } from '../../templates/domain/template';
import { Organization } from '../../organizations/domain/organization';
import { TraceabilityEventsService } from '../../traceability-events/infrastructure/traceability-events.service';
import { TraceabilityEventWrapper } from '../../traceability-events/domain/traceability-event-wrapper';
import { TraceabilityEvent } from '../../traceability-events/domain/traceability-event';
import { Connection, Model as MongooseModel } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from '../../unique-product-identifier/infrastructure/unique-product-identifier.schema';
import { OrganizationsService } from '../../organizations/infrastructure/organizations.service';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { User } from '../../users/domain/user';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../organizations/infrastructure/organization.entity';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { UsersService } from '../../users/infrastructure/users.service';
import { ModelDoc, ModelDocSchemaVersion, ModelSchema } from './model.schema';
import { UniqueProductIdentifierService } from '../../unique-product-identifier/infrastructure/unique-product-identifier.service';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { laptopFactory } from '../../templates/fixtures/laptop.factory';
import { Model } from '../domain/model';
import { expect } from '@jest/globals';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { KeycloakResourcesServiceTesting } from '@app/testing/keycloak.resources.service.testing';
import { ignoreIds } from '@app/testing/utils';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

describe('ModelsService', () => {
  let modelsService: ModelsService;
  const user = new User(randomUUID(), 'test@example.com');
  const organization = Organization.create({ name: 'Firma Y', user });
  let mongoConnection: Connection;
  let modelDoc: MongooseModel<ModelDoc>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
        ]),
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
      ],
      providers: [
        ModelsService,
        UniqueProductIdentifierService,
        OrganizationsService,
        UsersService,
        KeycloakResourcesService,
        {
          provide: TraceabilityEventsService,
          useValue: {
            save: jest
              .fn()
              .mockImplementation(
                (event: TraceabilityEventWrapper<TraceabilityEvent>) =>
                  Promise.resolve(event),
              ),
          },
        },
      ],
    })
      .overrideProvider(KeycloakResourcesService)
      .useClass(KeycloakResourcesServiceTesting)
      .compile();

    modelsService = module.get<ModelsService>(ModelsService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    modelDoc = mongoConnection.model(ModelDoc.name, ModelSchema);
  });

  it('should create a model', async () => {
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: organization.id, userId: user.id }),
    );
    const model = Model.create({
      name: 'My product',
      userId: user.id,
      organizationId: organization.id,
      template,
    });

    model.addDataValues([
      DataValue.create({
        value: undefined,
        dataSectionId: template.sections[2].id,
        dataFieldId: template.sections[2].dataFields[0].id,
        row: 0,
      }),
    ]);
    const { id } = await modelsService.save(model);
    const foundModel = await modelsService.findOneOrFail(id);
    expect(foundModel.name).toEqual(model.name);
    expect(foundModel.description).toEqual(model.description);
    expect(foundModel.templateId).toEqual(template.id);
    expect(foundModel.dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[0].id,
          dataFieldId: template.sections[0].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[0].id,
          dataFieldId: template.sections[0].dataFields[1].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[1].id,
          dataFieldId: template.sections[1].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[2].id,
          dataFieldId: template.sections[2].dataFields[0].id,
          row: 0,
        }),
      ]),
    );
    expect(foundModel.createdByUserId).toEqual(user.id);
    expect(foundModel.isOwnedBy(organization.id)).toBeTruthy();
  });

  it('fails if requested model could not be found', async () => {
    await expect(modelsService.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Model.name),
    );
  });

  it('should find all models of organization', async () => {
    const otherOrganizationId = randomUUID();
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: organization.id, userId: user.id }),
    );

    const model1 = Model.create({
      name: 'Product A',
      userId: user.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model2 = Model.create({
      name: 'Product B',
      userId: user.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model3 = Model.create({
      name: 'Product C',
      userId: user.id,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model1);
    await modelsService.save(model2);
    await modelsService.save(model3);

    const foundModels =
      await modelsService.findAllByOrganization(otherOrganizationId);
    expect(foundModels.map((m) => m)).toEqual(
      [model1, model2, model3].map((m) => m),
    );
  });

  it(`should migrate from ${ModelDocSchemaVersion.v1_0_0} to ${ModelDocSchemaVersion.v1_0_1}`, async () => {
    const id = randomUUID();
    await modelDoc.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          _schemaVersion: ModelDocSchemaVersion.v1_0_0,
          name: 'Migration Name',
          description: 'desc',
          productDataModelId: 'templateId',
          dataValues: [],
          createdByUserId: 'userId',
          ownedByOrganizationId: 'orgId',
        },
      },
      { upsert: true },
    );
    const found = await modelsService.findOneOrFail(id); // or _id: new ObjectId(idAsString)
    expect(found.templateId).toEqual('templateId');
    const saved = await modelsService.save(found);
    expect(saved.templateId).toEqual('templateId');
  });

  afterAll(async () => {
    await mongoConnection.close();
  });
});
