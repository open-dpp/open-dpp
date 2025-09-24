import { Test, TestingModule } from '@nestjs/testing';
import { PassportMetricModule } from '../passport-metric.module';
import { PassportMetricController } from './passport-metric.controller';
import { randomUUID } from 'crypto';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  PassportMetricDoc,
  PassportMetricSchema,
} from '../infrastructure/passport-metric.schema';
import {
  PassportMetricService,
  TimePeriod,
} from '../infrastructure/passport-metric.service';
import { MeasurementType, PassportMetric } from '../domain/passport-metric';
import { Connection } from 'mongoose';
import getKeycloakAuthToken from '@app/testing/auth-token-helper.testing';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PermissionModule } from '@app/permission/permission.module';
import { PassportService } from '../../passports/passport.service';
import { PassportServiceTesting } from '@app/testing/passport.service.testing';
import { Passport } from '../../passports/domain/passport';
import { passportFactory } from '../../passports/fixtures/passport.factory';
import { dataFieldFactory } from '../fixtures/passport-metric.factory';
import { expect } from '@jest/globals';

describe('PassportMetricController', () => {
  let app: INestApplication;

  let passportMetricService: PassportMetricService;
  let controller: PassportMetricController;
  let module: TestingModule;
  let mongoConnection: Connection;
  const userId = randomUUID();
  const organizationId = randomUUID();
  const reflector = new Reflector();

  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  const passportService = new PassportServiceTesting();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportMetricDoc.name,
            schema: PassportMetricSchema,
          },
        ]),
        PermissionModule,
        PassportMetricModule,
      ],
      providers: [
        PassportService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
      controllers: [PassportMetricController],
    })
      .overrideProvider(PassportService)
      .useValue(passportService)
      .compile();

    mongoConnection = module.get<Connection>(getConnectionToken());
    passportMetricService = module.get<PassportMetricService>(
      PassportMetricService,
    );
    controller = module.get<PassportMetricController>(PassportMetricController);
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

  it('should handle item updated event', async () => {
    const field1 = dataFieldFactory.build({ value: 1 });
    const field2 = dataFieldFactory.build({ value: 2 });
    const fieldValues = [field1, field2];
    const payload = {
      modelId: randomUUID(),
      templateId: randomUUID(),
      organizationId: randomUUID(),
      fieldValues: fieldValues,
      date: '2025-01-01T12:00:00Z',
    };
    const { id } = await controller.handleItemUpdated(payload);
    const date = new Date(payload.date);
    const pass = await passportMetricService.findByIdOrFail(id);
    expect(pass.date).toEqual(date);
    expect(pass.source).toEqual({
      modelId: payload.modelId,
      templateId: payload.templateId,
      organizationId: payload.organizationId,
      type: MeasurementType.FIELD_AGGREGATE,
    });
    const source = {
      modelId: payload.modelId,
      templateId: payload.templateId,
      organizationId: payload.organizationId,
      type: MeasurementType.FIELD_AGGREGATE,
    };
    const passportMetric = await passportMetricService.findOneOrFail(
      source,
      date,
    );

    expect(passportMetric.values).toEqual([
      {
        key: field1.dataFieldId,
        row: 0,
        value: 1,
      },
      {
        key: field2.dataFieldId,
        row: 0,
        value: 2,
      },
    ]);
  });

  it('/POST should create page view metric', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const page = 'http://example.com/page';
    const uuid = randomUUID();
    const passport = Passport.create(
      passportFactory.build({ ownedByOrganizationId: organizationId, uuid }),
    );
    passportService.addPassport(uuid, passport);
    const response = await request(app.getHttpServer())
      .post(`/passport-metrics/page-views`)
      .send({
        page,
        uuid,
      });
    expect(response.status).toEqual(201);
    const passportMetric = await passportMetricService.findByIdOrFail(
      response.body.id,
    );
    expect(passportMetric.source).toEqual({
      organizationId: passport.ownedByOrganizationId,
      templateId: passport.templateId,
      modelId: passport.modelId,
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

    const response = await request(app.getHttpServer())
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
    const response = await request(app.getHttpServer())
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
    const response = await request(app.getHttpServer())
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
  });
});
