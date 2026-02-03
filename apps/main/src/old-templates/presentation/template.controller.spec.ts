import type { INestApplication } from "@nestjs/common";
import type { TemplateDbProps } from "../domain/template";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../identity/users/application/services/users.service";
import { Template } from "../domain/template";
import { laptopFactory } from "../fixtures/laptop.factory";
import { templateCreatePropsFactory } from "../fixtures/template.factory";
import { OldTemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplateService } from "../infrastructure/template.service";
import { templateToDto } from "./dto/template.dto";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  let app: INestApplication;
  let service: TemplateService;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
            name: OldTemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        TemplateService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [TemplateController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    service = moduleRef.get<TemplateService>(TemplateService);
    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));

    app = moduleRef.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  const userHasNotThePermissionsTxt = `fails if user has not the permissions`;

  it(`/GET template`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopPlain: TemplateDbProps = laptopFactory
      .addSections()
      .build({ organizationId: org.id });
    const template = Template.loadFromDb({ ...laptopPlain });

    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/templates/${template.id}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(templateToDto(template));
  });

  it(`/GET template ${userHasNotThePermissionsTxt}`, async () => {
    const { userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = Template.create(
      templateCreatePropsFactory.build({
        organizationId: org2.id,
      }),
    );
    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${org2.id}/templates/${template.id}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(403);
  });

  it(`/GET all templates which belong to the organization`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopPlain: TemplateDbProps = laptopFactory
      .addSections()
      .build({ organizationId: org.id });
    const laptopTemplate = Template.loadFromDb({
      ...laptopPlain,
      organizationId: org.id,
    });
    const phoneTemplate = Template.loadFromDb({
      ...laptopPlain,
      id: randomUUID(),
      name: "phone",
      organizationId: org.id,
    });
    const notAccessibleTemplate = Template.create(
      templateCreatePropsFactory.build({
        name: "privateModel",
        organizationId: org2.id,
      }),
    );

    await service.save(laptopTemplate);
    await service.save(phoneTemplate);
    await service.save(notAccessibleTemplate);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/templates`)
      .set("Cookie", userCookie);
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
    const { userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const response = await request(app.getHttpServer())
      .get(`/organizations/${org2.id}/templates`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
