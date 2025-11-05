import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { passportTemplatePublicationPropsFactory } from "../fixtures/passport.template.factory";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "./passport-template-publication.schema";
import { PassportTemplatePublicationService } from "./passport-template-publication.service";

describe("passportTemplateService", () => {
  let app: INestApplication;
  let service: PassportTemplatePublicationService;
  let module: TestingModule;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  const mockNow = new Date("2025-01-01T12:00:00Z").getTime();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [PassportTemplatePublicationService, {
        provide: APP_GUARD,
        useClass: AuthGuard,
      }],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    service = module.get<PassportTemplatePublicationService>(
      PassportTemplatePublicationService,
    );
    mongoConnection = module.get<Connection>(getConnectionToken());
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fails if requested passport template could not be found", async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(PassportTemplatePublication.name),
    );
  });

  it("should create passport template", async () => {
    const { org, user } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ ownedByOrganizationId: org.id, createdByUserId: user.id }),
    );

    const { id } = await service.save(passportTemplate);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(passportTemplate);
  });

  it("should find all passport templates", async () => {
    const { org, user } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ ownedByOrganizationId: org.id, createdByUserId: user.id }),
    );
    const passportTemplate2 = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ id: randomUUID(), ownedByOrganizationId: org.id, createdByUserId: user.id }),
    );

    await service.save(passportTemplate);
    await service.save(passportTemplate2);
    const found = await service.findAll();
    expect(found).toContainEqual(passportTemplate);
    expect(found).toContainEqual(passportTemplate2);
  });

  afterAll(async () => {
    await module.close();
  });
});
