import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { getApp, MongooseTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthTestingGuard } from "../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { EmailService } from "../../email/email.service";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { UsersService } from "../../users/infrastructure/users.service";
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
  const betterAuthTestingGuard = new BetterAuthTestingGuard(new Reflector());
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);

  let mongoConnection: Connection;
  let module: TestingModule;
  let passportTemplateService: PassportTemplatePublicationService;

  const mockNow = new Date("2025-01-01T12:00:00Z");

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        OrganizationsService,
        UsersService,
        PassportTemplatePublicationService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getUserById: jest.fn((userId) => {
              // Return the appropriate test user based on userId
              return TestUsersAndOrganizations.users.user1.id === userId
                ? TestUsersAndOrganizations.users.user1
                : TestUsersAndOrganizations.users.user2;
            }),
          },
        },
        {
          provide: APP_GUARD,
          useValue: betterAuthTestingGuard,
        },
      ],
      controllers: [PassportTemplatePublicationController],
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());
    passportTemplateService = module.get(PassportTemplatePublicationService);
    const organizationService = module.get(OrganizationsService);

    await app.init();

    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`/GET find all passport templates`, async () => {
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
