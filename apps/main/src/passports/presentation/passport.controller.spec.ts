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
import { SubmodelResponseDtoSchema } from "../../aas/presentation/dto/submodel.dto";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../infrastructure/passport.schema";
import { PassportsModule } from "../passports.module";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  let app: INestApplication;
  let authService: AuthService;
  let passportRepository: PassportRepository;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;

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
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AasModule,
        AuthModule,
        PassportsModule,
      ],
      providers: [
        PassportRepository,
        AasRepository,
        SubmodelRepository,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [PassportController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    await app.init();
    passportRepository = moduleRef.get<PassportRepository>(PassportRepository);
    aasRepository = moduleRef.get<AasRepository>(AasRepository);
    submodelRepository = moduleRef.get<SubmodelRepository>(SubmodelRepository);

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it(`/GET shells`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const aas = AssetAdministrationShell.fromPlain(aasPlainFactory.build());
    await aasRepository.save(aas);
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await passportRepository.save(passport);

    const response = await request(app.getHttpServer())
      .get(`/passports/${passport.id}/shells?limit=1`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(aas.id);
    expect(response.body.result).toEqual(AssetAdministrationShellResponseDtoSchema.shape.result.parse([aas.toPlain()]));
  });

  it(`/GET submodels`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const submodels = [Submodel.fromPlain(submodelDesignOfProductPlainFactory.build()), Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build())];
    for (const s of submodels) {
      await submodelRepository.save(s);
    }
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
    });
    await passportRepository.save(passport);

    const response = await request(app.getHttpServer())
      .get(`/passports/${passport.id}/submodels?limit=2`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(submodels[1].id);
    expect(response.body.result).toEqual(SubmodelResponseDtoSchema.shape.result.parse(submodels.map(s => s.toPlain())));
  });

  afterAll(async () => {
    await app.close();
  });
});
