import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { passportTemplatePublicationPropsFactory } from '../fixtures/passport-template-publication-props.factory';
import { PassportTemplatePublicationService } from '../infrastructure/passport-template-publication.service';
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from '../infrastructure/passport-template-publication.schema';
import { PassportTemplatePublication } from '../domain/passport-template-publication';
import { passportTemplatePublicationToDto } from './dto/passport-template-publication.dto';
import { expect } from '@jest/globals';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { MarketplaceModule } from '../marketplace.module';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { getApp } from '@app/testing/utils';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  let mongoConnection: Connection;
  let module: TestingModule;
  let passportTemplateService: PassportTemplatePublicationService;

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
        TypeOrmTestingModule,
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
        MarketplaceModule,
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
    passportTemplateService = module.get(PassportTemplatePublicationService);

    await app.init();
  });

  it(`/GET find all passport templates`, async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build(),
    );
    const passportTemplate2 = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ id: randomUUID() }),
    );

    await passportTemplateService.save(passportTemplate);
    await passportTemplateService.save(passportTemplate2);
    const response = await request(getApp(app)).get(`/templates/passports`);
    expect(response.status).toEqual(200);
    expect(response.body).toContainEqual(
      passportTemplatePublicationToDto(passportTemplate),
    );
    expect(response.body).toContainEqual(
      passportTemplatePublicationToDto(passportTemplate2),
    );
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
