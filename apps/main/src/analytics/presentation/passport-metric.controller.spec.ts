import { Test, TestingModule } from '@nestjs/testing';
import { PassportMetricController } from './passport-metric.controller';
import { randomUUID } from 'crypto';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  PassportMetricService,
  TimePeriod,
} from '../infrastructure/passport-metric.service';
import { MeasurementType, PassportMetric } from '../domain/passport-metric';
import { Connection } from 'mongoose';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { AnalyticsModule } from '../analytics.module';
import { Template } from '../../templates/domain/template';
import { laptopFactory } from '../../templates/fixtures/laptop.factory';
import { Model } from '../../models/domain/model';
import { getApp } from '@app/testing/utils';
import { ModelsService } from '../../models/infrastructure/models.service';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { UniqueProductIdentifierApplicationService } from '../../unique-product-identifier/presentation/unique.product.identifier.application.service';
import { ItemsService } from '../../items/infrastructure/items.service';
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from '../../unique-product-identifier/infrastructure/unique-product-identifier.schema';
import { ItemDoc, ItemSchema } from '../../items/infrastructure/item.schema';
import {
  ModelDoc,
  ModelSchema,
} from '../../models/infrastructure/model.schema';
import { UniqueProductIdentifierService } from '../../unique-product-identifier/infrastructure/unique-product-identifier.service';
import { PermissionService } from '@app/permission';
import getKeycloakAuthToken from '@app/testing/auth-token-helper.testing';

describe('PassportMetricController', () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let passportMetricService: PassportMetricService;
  let module: TestingModule;
  let mongoConnection: Connection;
  const userId = randomUUID();
  const organizationId = randomUUID();
  const reflector = new Reflector();

  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ItemDoc.name,
            schema: ItemSchema,
          },
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
        ]),
        AnalyticsModule,
      ],
      providers: [
        PermissionService,
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
        ModelsService,
        ItemsService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
      controllers: [PassportMetricController],
    }).compile();

    mongoConnection = module.get<Connection>(getConnectionToken());
    passportMetricService = module.get<PassportMetricService>(
      PassportMetricService,
    );
    modelsService = module.get<ModelsService>(ModelsService);
    app = module.createNestApplication();
    await app.init();
    await passportMetricService.findOne(
      {
        modelId: randomUUID(),
        type: MeasurementType.PAGE_VIEWS,
        templateId: randomUUID(),
        organizationId: randomUUID(),
      },
      new Date(),
    );
  });

  beforeEach(() => {
    jest.spyOn(reflector, 'get').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // it('should handle item updated event', async () => {
  //   const field1 = dataFieldFactory.build({ value: 1 });
  //   const field2 = dataFieldFactory.build({ value: 2 });
  //   const fieldValues = [field1, field2];
  //   const payload = {
  //     modelId: randomUUID(),
  //     templateId: randomUUID(),
  //     organizationId: randomUUID(),
  //     fieldValues: fieldValues,
  //     date: '2025-01-01T12:00:00Z',
  //   };
  //   const { id } = await controller.handleItemUpdated(payload);
  //   const date = new Date(payload.date);
  //   const pass = await passportMetricService.findByIdOrFail(id);
  //   expect(pass.date).toEqual(date);
  //   expect(pass.source).toEqual({
  //     modelId: payload.modelId,
  //     templateId: payload.templateId,
  //     organizationId: payload.organizationId,
  //     type: MeasurementType.FIELD_AGGREGATE,
  //   });
  //   const source = {
  //     modelId: payload.modelId,
  //     templateId: payload.templateId,
  //     organizationId: payload.organizationId,
  //     type: MeasurementType.FIELD_AGGREGATE,
  //   };
  //   const passportMetric = await passportMetricService.findOneOrFail(
  //     source,
  //     date,
  //   );
  //
  //   expect(passportMetric.values).toEqual([
  //     {
  //       key: field1.dataFieldId,
  //       row: 0,
  //       value: 1,
  //     },
  //     {
  //       key: field2.dataFieldId,
  //       row: 0,
  //       value: 2,
  //     },
  //   ]);
  // });

  it('/POST should create page view metric', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const template = Template.loadFromDb(
      laptopFactory.build({ organizationId, userId }),
    );
    const model = Model.create({
      name: 'My product',
      userId,
      organizationId,
      template,
    });
    const uniqueProductIdentifier = model.createUniqueProductIdentifier();

    await modelsService.save(model);

    const page = 'http://example.com/page';
    const response: { status: number; body: { id: string } } = await request(
      getApp(app),
    )
      .post(`/passport-metrics/page-views`)
      .send({
        page,
        uuid: uniqueProductIdentifier.uuid,
      });
    expect(response.status).toEqual(201);
    const passportMetric = await passportMetricService.findByIdOrFail(
      response.body.id,
    );
    expect(passportMetric.source).toEqual({
      organizationId: model.ownedByOrganizationId,
      templateId: model.templateId,
      modelId: model.id,
      type: MeasurementType.PAGE_VIEWS,
    });
    expect(passportMetric.values).toEqual([
      { key: page, row: null, value: 1 },
      { key: 'http://example.com', row: null, value: 1 },
    ]);
  });

  it(`/GET passport metrics`, async () => {
    const templateId = randomUUID();
    const date1 = new Date('2025-01-01T13:00:00Z');
    const date2 = new Date('2025-01-01T14:00:00Z');
    const source = {
      templateId,
      organizationId,
      modelId: randomUUID(),
    };
    const page = 'http://example.com/page1';
    const pageView1 = PassportMetric.createPageView({
      source,
      page,
      date: date1,
    });
    const pageView2 = PassportMetric.createPageView({
      source,
      page,
      date: date2,
    });

    await passportMetricService.create(pageView1);
    await passportMetricService.create(pageView2);

    const response = await request(getApp(app))
      .get(
        `/organizations/${organizationId}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T12:00:00Z&endDate=2025-03-01T13:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([
      {
        datetime: '2025-01-01T00:00:00.000Z',
        sum: 2,
      },
    ]);
  });
  //
  it(`/GET passport returns empty array if template is not part of organization`, async () => {
    const templateId = randomUUID();
    const date = new Date('2025-01-01T13:00:00Z');
    const source = {
      templateId,
      organizationId,
      modelId: randomUUID(),
    };

    const page = 'http://example.com/page1';
    const pageView = PassportMetric.createPageView({
      source,
      page,
      date: date,
    });

    await passportMetricService.create(pageView);
    const otherOrganizationId = randomUUID();
    const response = await request(getApp(app))
      .get(
        `/organizations/${otherOrganizationId}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T12:00:00Z&endDate=2025-01-01T13:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [otherOrganizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it(`/GET passport metrics fails if user is not member of organization`, async () => {
    const otherOrganizationId = randomUUID();
    const response = await request(getApp(app))
      .get(
        `/organizations/${otherOrganizationId}/passport-metrics?templateId=${randomUUID()}&modelId=${randomUUID()}&startDate=2025-01-01T12:00:00Z&endDate=2025-01-01T13:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
    await app.close();
  });
});
