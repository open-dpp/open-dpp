import { Test } from '@nestjs/testing';

import { AuthContext } from '../../auth/auth-request';

import { User } from '../../users/domain/user';
import { randomUUID } from 'crypto';
import { TemplateService } from '../../templates/infrastructure/template.service';
import { TemplateModule } from '../../templates/template.module';
import { INestApplication } from '@nestjs/common';
import { ModelsService } from '../../models/infrastructure/models.service';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { TypeOrmTestingModule } from '../../../test/typeorm.testing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UniqueProductIdentifierModule } from '../unique.product.identifier.module';
import { Model } from '../../models/domain/model';
import * as request from 'supertest';
import { KeycloakAuthTestingGuard } from '../../../test/keycloak-auth.guard.testing';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { Template, TemplateDbProps } from '../../templates/domain/template';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { Item } from '../../items/domain/item';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { ItemsService } from '../../items/infrastructure/items.service';
import getKeycloakAuthToken from '../../../test/auth-token-helper.testing';
import { phoneFactory } from '../../product-passport/fixtures/product-passport.factory';
import { ALLOW_SERVICE_ACCESS } from '../../auth/decorators/allow-service-access.decorator';

describe('UniqueProductIdentifierController', () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let itemsService: ItemsService;
  const serviceToken = 'serviceToken';

  let templateService: TemplateService;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
    new Map([['SERVICE_TOKEN', serviceToken]]),
  );
  const authContext = new AuthContext();
  authContext.user = new User(randomUUID(), `${randomUUID()}@example.com`);
  const organizationId = randomUUID();

  beforeEach(() => {
    jest.spyOn(reflector, 'get').mockReturnValue(false);
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([UserEntity]),
        MongooseTestingModule,
        UniqueProductIdentifierModule,
        TemplateModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get<TemplateService>(TemplateService);

    app = moduleRef.createNestApplication();

    await app.init();
  });
  const authProps = { userId: authContext.user.id, organizationId };
  const phoneTemplate: TemplateDbProps = phoneFactory
    .addSections()
    .build(authProps);

  it(`/GET reference of unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: 'model',
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId,
      userId: authContext.user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier('externalId');
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      organizationId,
      modelId: model.id,
      granularityLevel: GranularityLevel.ITEM,
    });
  });

  it(`/GET organizationId of unique product identifier`, async () => {
    jest
      .spyOn(reflector, 'get')
      .mockImplementation((key) => key === ALLOW_SERVICE_ACCESS);

    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: 'model',
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId,
      userId: authContext.user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier('externalId');
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${uuid}/metadata`)
      .set('service_token', serviceToken);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      organizationId,
    });
  });

  it(`/GET fails to return organizationId of unique product identifier if service token invalid`, async () => {
    jest
      .spyOn(reflector, 'get')
      .mockImplementation((key) => key === ALLOW_SERVICE_ACCESS);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${randomUUID()}/metadata`)
      .set('service_token', 'invalid_token');
    expect(response.status).toEqual(401);
  });

  it(`/GET model reference of unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: 'model',
      userId: randomUUID(),
      organizationId: organizationId,
      template,
    });
    const { uuid } = model.createUniqueProductIdentifier();
    await modelsService.save(model);
    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: model.id,
      organizationId,
      granularityLevel: GranularityLevel.MODEL,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
