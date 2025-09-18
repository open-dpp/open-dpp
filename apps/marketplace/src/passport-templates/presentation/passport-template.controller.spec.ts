import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { PassportTemplateModule } from '../passport-template.module';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  passportRequestFactory,
  passportTemplatePropsFactory,
} from '../fixtures/passport-template-props.factory';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import {
  PassportTemplateDbSchema,
  PassportTemplateDoc,
} from '../infrastructure/passport-template.schema';
import { PassportTemplate } from '../domain/passport-template';
import { passportTemplateToDto } from './dto/passport-template.dto';
import { expect } from '@jest/globals';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import getKeycloakAuthToken from '@app/testing/auth-token-helper.testing';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  let mongoConnection: Connection;
  let module: TestingModule;
  let passportTemplateService: PassportTemplateService;
  const userId = randomUUID();
  const organizationId = randomUUID();

  const mockNow = new Date('2025-01-01T12:00:00Z');

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow.getTime());
    jest.spyOn(reflector, 'get').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplateDoc.name,
            schema: PassportTemplateDbSchema,
          },
        ]),
        PassportTemplateModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());
    passportTemplateService = module.get(PassportTemplateService);

    await app.init();
  });

  it(`/POST passport template`, async () => {
    const passportTemplate = passportRequestFactory.build();
    const userEmail = 'user@example.com';
    const response = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/templates/passports`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send(passportTemplate);
    expect(response.status).toEqual(201);
    const found = await passportTemplateService.findOneOrFail(response.body.id);

    expect(found).toEqual(
      PassportTemplate.loadFromDb({
        ...passportTemplate,
        contactEmail: userEmail,
        ownedByOrganizationId: organizationId,
        createdByUserId: userId,
        isOfficial: false,
        createdAt: mockNow,
        updatedAt: mockNow,
        id: response.body.id,
      }),
    );
  });

  it(`/POST passport template fails if user is not member of organization`, async () => {
    const passportTemplate = passportRequestFactory.build();
    const otherOrganizationId = randomUUID();
    const response = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/templates/passports`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [otherOrganizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send(passportTemplate);
    expect(response.status).toEqual(403);
  });

  it(`/GET find passport template`, async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );
    await passportTemplateService.save(passportTemplate);
    const response = await request(app.getHttpServer()).get(
      `/templates/passports/${passportTemplate.id}`,
    );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(passportTemplateToDto(passportTemplate));
  });

  it(`/GET find all passport templates`, async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );
    const passportTemplate2 = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build({ id: randomUUID() }),
    );

    await passportTemplateService.save(passportTemplate);
    await passportTemplateService.save(passportTemplate2);
    const response = await request(app.getHttpServer()).get(
      `/templates/passports`,
    );
    expect(response.status).toEqual(200);
    expect(response.body).toContainEqual(
      passportTemplateToDto(passportTemplate),
    );
    expect(response.body).toContainEqual(
      passportTemplateToDto(passportTemplate2),
    );
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
