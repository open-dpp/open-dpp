import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { EnvModule, EnvService } from "@open-dpp/env";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AasModule } from "../../aas/aas.module";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../aas/domain/environment";
import { SubmodelJsonSchema } from "../../aas/domain/parsing/submodel-base/submodel-json-schema";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { aasPlainFactory } from "../../aas/fixtures/aas.factory";
import {
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "../../aas/fixtures/submodel.factory";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../aas/infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { AssetAdministrationShellResponseDtoSchema } from "../../aas/presentation/dto/asset-administration-shell.dto";
import { SubmodelPaginationResponseDtoSchema } from "../../aas/presentation/dto/submodel.dto";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  let app: INestApplication;
  let authService: AuthService;
  let templateRepository: TemplateRepository;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;

  const betterAuthHelper = new BetterAuthHelper();
  const basePath = "/templates";
  let aas: AssetAdministrationShell;
  let submodels: Submodel[];

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
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        AasModule,
        AuthModule,
        TemplatesModule,
      ],
      providers: [
        TemplateRepository,
        AasRepository,
        SubmodelRepository,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [TemplateController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    await app.init();
    templateRepository = moduleRef.get<TemplateRepository>(TemplateRepository);
    aasRepository = moduleRef.get<AasRepository>(AasRepository);
    submodelRepository = moduleRef.get<SubmodelRepository>(SubmodelRepository);

    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    aas = AssetAdministrationShell.fromPlain(aasPlainFactory.build(undefined, { transient: { iriDomain } }));
    submodels = [Submodel.fromPlain(submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } })), Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }))];
    await aasRepository.save(aas);
    for (const s of submodels) {
      await submodelRepository.save(s);
    }

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  async function createTemplate(orgId: string): Promise<Template> {
    return templateRepository.save(Template.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
    }));
  }

  it(`/GET shells`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${template.id}/shells?limit=1`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(aas.id);
    expect(response.body.result).toEqual(AssetAdministrationShellResponseDtoSchema.shape.result.parse([aas.toPlain()]));
  });

  it(`/GET submodels`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${template.id}/submodels?limit=2`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(submodels[1].id);
    expect(response.body.result).toEqual(SubmodelPaginationResponseDtoSchema.shape.result.parse(submodels.map(s => s.toPlain())));
  });

  it(`/GET submodel by id`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${template.id}/submodels/${btoa(submodels[1].id)}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(SubmodelJsonSchema.parse(submodels[1].toPlain()));
  });

  afterAll(async () => {
    await app.close();
  });
});
