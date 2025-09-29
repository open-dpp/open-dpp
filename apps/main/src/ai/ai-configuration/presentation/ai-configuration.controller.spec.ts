import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { aiConfigurationToDto } from './dto/ai-configuration.dto';
import getKeycloakAuthToken from '@app/testing/auth-token-helper.testing';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { AiConfigurationModule } from '../ai-configuration.module';
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from '../infrastructure/ai-configuration.schema';
import { AiConfigurationService } from '../infrastructure/ai-configuration.service';
import { aiConfigurationFactory } from '../fixtures/ai-configuration-props.factory';
import { AiConfiguration, AiProvider } from '../domain/ai-configuration';
import { NotFoundInDatabaseExceptionFilter } from '@app/exception/exception.handler';
import request from 'supertest';

describe('AiConfigurationController', () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  let mongoConnection: Connection;
  let module: TestingModule;
  let aiConfigurationService: AiConfigurationService;
  const userId = randomUUID();

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
            name: AiConfigurationDoc.name,
            schema: AiConfigurationDbSchema,
          },
        ]),
        AiConfigurationModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());
    mongoConnection = module.get(getConnectionToken());
    aiConfigurationService = module.get(AiConfigurationService);

    await app.init();
  });

  it(`/PUT create configuration`, async () => {
    const orgaId = randomUUID();
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: 'codestral-latest',
    };
    const response = await request(app.getHttpServer())
      .put(`/organizations/${orgaId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [orgaId], keycloakAuthTestingGuard),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found = await aiConfigurationService.findOneByOrganizationId(orgaId);
    expect(found).toBeDefined();
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/PUT create configuration fails if user is no member of organization`, async () => {
    const orgaId = randomUUID();
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: 'codestral-latest',
    };
    const response = await request(app.getHttpServer())
      .put(`/organizations/${orgaId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [randomUUID()], keycloakAuthTestingGuard),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PUT update configuration`, async () => {
    const orgaId = randomUUID();
    const configuration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({
        ownedByOrganizationId: orgaId,
      }),
    );
    const { id } = await aiConfigurationService.save(configuration);
    const body = {
      isEnabled: false,
      provider: AiProvider.Ollama,
      model: 'qwen3:0.6b',
    };
    const response = await request(app.getHttpServer())
      .put(`/organizations/${orgaId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [orgaId], keycloakAuthTestingGuard),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found = await aiConfigurationService.findOneByOrganizationId(orgaId);
    expect(found.id).toEqual(id);
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/GET find configuration`, async () => {
    const organizationId = randomUUID();

    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: organizationId }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(aiConfigurationToDto(aiConfiguration));
  });

  it(`/GET find configuration fails if user is no member of organization`, async () => {
    const organizationId = randomUUID();

    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: organizationId }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [randomUUID()], keycloakAuthTestingGuard),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET cannot find configuration`, async () => {
    const orgaId = randomUUID();
    const response = await request(app.getHttpServer())
      .get(`/organizations/${orgaId}/configurations`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [orgaId], keycloakAuthTestingGuard),
      );
    expect(response.status).toEqual(404);
  });

  afterAll(async () => {
    await app.close();
    await mongoConnection.close();
    await module.close();
  });
});
