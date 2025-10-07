import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { PermissionModule } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import { getApp, KeycloakAuthTestingGuard, MongooseTestingModule, TypeOrmTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { OrganizationEntity } from "../../organizations/infrastructure/organization.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { passportTemplatePublicationPropsFactory } from "../fixtures/passport.template.factory";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../infrastructure/passport-template-publication.schema";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import { passportTemplatePublicationToDto } from "./dto/passport-template-publication.dto";
import { PassportTemplatePublicationController } from "./passport-template-publication.controller";

describe("passportTemplateController", () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );

  let mongoConnection: Connection;
  let module: TestingModule;
  let passportTemplateService: PassportTemplatePublicationService;

  const mockNow = new Date("2025-01-01T12:00:00Z");

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        TypeOrmTestingModule,
        TypeOrmTestingModule.forFeature([OrganizationEntity, UserEntity]),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
        PermissionModule,
      ],
      providers: [
        PassportTemplatePublicationService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
      controllers: [PassportTemplatePublicationController],
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());
    passportTemplateService = module.get(PassportTemplatePublicationService);

    await app.init();
  });
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow.getTime());
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`/GET find all passport templates`, async () => {
    jest.spyOn(reflector, "get").mockReturnValue(true);
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
