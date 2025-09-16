import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthTestingGuard } from '../../../test/keycloak-auth.guard.testing';
import { AuthContext } from '../../auth/auth-request';
import { User } from '../../users/domain/user';
import { randomUUID } from 'crypto';
import { TemplateService } from '../infrastructure/template.service';
import { TemplateModule } from '../template.module';
import { Template, TemplateDbProps } from '../domain/template';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { KeycloakResourcesServiceTesting } from '../../../test/keycloak.resources.service.testing';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { TemplateDoc, TemplateSchema } from '../infrastructure/template.schema';
import { Connection } from 'mongoose';
import { templateToDto } from './dto/template.dto';
import getKeycloakAuthToken from '../../../test/auth-token-helper.testing';
import { templateCreatePropsFactory } from '../fixtures/template.factory';
import { laptopFactory } from '../fixtures/laptop.factory';

describe('TemplateController', () => {
  let app: INestApplication;
  let service: TemplateService;
  let mongoConnection: Connection;

  const authContext = new AuthContext();
  authContext.user = new User(randomUUID(), 'test@test.test');
  const organizationId = randomUUID();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(new Map());
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        TemplateModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [{ id: authContext.user.id, email: authContext.user.email }],
        }),
      )
      .compile();

    service = moduleRef.get<TemplateService>(TemplateService);
    mongoConnection = moduleRef.get<Connection>(getConnectionToken());
    app = moduleRef.createNestApplication();

    await app.init();
  });

  const laptopPlain: TemplateDbProps = laptopFactory
    .addSections()
    .build({ organizationId });

  const userHasNotThePermissionsTxt = `fails if user has not the permissions`;

  it(`/GET template`, async () => {
    const template = Template.loadFromDb({ ...laptopPlain });

    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates/${template.id}`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(templateToDto(template));
  });

  it(`/GET template ${userHasNotThePermissionsTxt}`, async () => {
    const otherOrganizationId = randomUUID();
    const template = Template.create(
      templateCreatePropsFactory.build({
        organizationId: otherOrganizationId,
      }),
    );
    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${otherOrganizationId}/templates/${template.id}`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(403);
  });

  it(`/GET all templates which belong to the organization`, async () => {
    const otherOrganizationId = randomUUID();
    const laptopTemplate = Template.loadFromDb({
      ...laptopPlain,
    });
    const phoneTemplate = Template.loadFromDb({
      ...laptopPlain,
      id: randomUUID(),
      name: 'phone',
    });
    const notAccessibleTemplate = Template.create(
      templateCreatePropsFactory.build({
        name: 'privateModel',
        organizationId: otherOrganizationId,
      }),
    );

    await service.save(laptopTemplate);
    await service.save(phoneTemplate);
    await service.save(notAccessibleTemplate);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);

    expect(response.body).toContainEqual({
      id: laptopTemplate.id,
      name: laptopTemplate.name,
      version: laptopTemplate.version,
      description: laptopTemplate.description,
      sectors: laptopTemplate.sectors,
    });
    expect(response.body).toContainEqual({
      id: phoneTemplate.id,
      name: phoneTemplate.name,
      version: phoneTemplate.version,
      description: phoneTemplate.description,
      sectors: phoneTemplate.sectors,
    });
    expect(response.body).not.toContainEqual({
      id: notAccessibleTemplate.id,
      name: notAccessibleTemplate.name,
      version: notAccessibleTemplate.version,
      description: notAccessibleTemplate.description,
      sectors: notAccessibleTemplate.sectors,
    });
  });

  it(`/GET all templates which belong to the organization ${userHasNotThePermissionsTxt}`, async () => {
    const otherOrganizationId = randomUUID();
    const response = await request(app.getHttpServer())
      .get(`/organizations/${otherOrganizationId}/templates`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.user.id,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
    await mongoConnection.close();
  });
});
