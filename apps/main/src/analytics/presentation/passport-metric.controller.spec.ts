import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import {
  getApp,
} from "../../../test/utils.for.test";
import { Environment } from "../../aas/domain/environment";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UsersModule } from "../../identity/users/users.module";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import {
  UniqueProductIdentifierApplicationService,
} from "../../unique-product-identifier/presentation/unique.product.identifier.application.service";
import { AnalyticsModule } from "../analytics.module";
import { MeasurementType, PassportMetric } from "../domain/passport-metric";
import { TimePeriod } from "../domain/time-period";
import { PassportMetricService } from "../infrastructure/passport-metric.service";
import { PassportMetricController } from "./passport-metric.controller";

describe("passportMetricController", () => {
  let app: INestApplication;
  let passportRepository: PassportRepository;
  let passportMetricService: PassportMetricService;
  let module: TestingModule;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;

  const betterAuthHelper = new BetterAuthHelper();

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
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ItemDoc.name,
            schema: ItemSchema,
          },
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AnalyticsModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      providers: [
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
        PassportRepository,
        ModelsService,
        ItemsService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [PassportMetricController],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    passportMetricService = module.get<PassportMetricService>(
      PassportMetricService,
    );
    passportRepository = module.get<PassportRepository>(PassportRepository);
    uniqueProductIdentifierService = module.get<UniqueProductIdentifierService>(UniqueProductIdentifierService);
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);

    await passportMetricService.findOne(
      {
        passportId: randomUUID(),
        type: MeasurementType.PAGE_VIEWS,
        templateId: randomUUID(),
        organizationId: randomUUID(),
      },
      new Date(),
    );
  });

  it("/POST should create page view metric", async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const passport = Passport.create({
      templateId: randomUUID(),
      organizationId: org.id,
      environment: Environment.create({}),
    });
    const uniqueProductIdentifier = passport.createUniqueProductIdentifier();
    await uniqueProductIdentifierService.save(uniqueProductIdentifier);
    await passportRepository.save(passport);

    const page = "http://example.com/page";
    const response: { status: number; body: { id: string } } = await request(
      getApp(app),
    )
      .post(`/passport-metrics/page-views`)
      .set("Cookie", userCookie)
      .send({
        page,
        uuid: uniqueProductIdentifier.uuid,
      });
    expect(response.status).toEqual(201);
    const passportMetric = await passportMetricService.findByIdOrFail(
      response.body.id,
    );
    expect(passportMetric.source).toEqual({
      organizationId: passport.getOrganizationId(),
      templateId: passport.templateId,
      passportId: passport.id,
      type: MeasurementType.PAGE_VIEWS,
    });
    expect(passportMetric.values).toEqual([
      { key: page, row: null, value: 1 },
      { key: "http://example.com", row: null, value: 1 },
    ]);
  });

  it(`/GET passport metrics`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const templateId = randomUUID();
    const date1 = new Date("2025-01-01T13:00:00Z");
    const date2 = new Date("2025-01-01T14:00:00Z");
    const source = {
      templateId,
      organizationId: org.id,
      passportId: randomUUID(),
    };
    const page = "http://example.com/page1";
    const pageView1 = PassportMetric.createPageView({
      source,
      page,
      date: date1,
    });
    const pageView2 = PassportMetric.createPageView({
      source,
      page,
      date: date2,
    });

    await passportMetricService.create(pageView1);
    await passportMetricService.create(pageView2);

    const response = await request(getApp(app))
      .get(
        `/organizations/${org.id}/passport-metrics?templateId=${templateId}&passportId=${source.passportId}&startDate=2025-01-01T00:00:00Z&endDate=2025-03-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set("Cookie", userCookie)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body)
      .toEqual([
        {
          datetime: "2025-01-01T00:00:00.000Z",
          sum: 2,
        },
        {
          datetime: "2025-02-01T00:00:00.000Z",
          sum: 0,
        },
        {
          datetime: "2025-03-01T00:00:00.000Z",
          sum: 0,
        },
      ]);
  });
  //
  it(`/GET passport returns metric results with sum value equal to zero if template is not part of organization`, async () => {
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { org: org2, userCookie: user2Cookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const templateId = randomUUID();
    const date = new Date("2025-01-01T13:00:00Z");
    const source = {
      templateId,
      organizationId: org.id,
      passportId: randomUUID(),
    };

    const page = "http://example.com/page1";
    const pageView = PassportMetric.createPageView({
      source,
      page,
      date,
    });

    await passportMetricService.create(pageView);
    const response = await request(getApp(app))
      .get(
        `/organizations/${org2.id}/passport-metrics?templateId=${templateId}&passportId=${source.passportId}&startDate=2025-01-01T00:00:00Z&endDate=2025-02-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set("Cookie", user2Cookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([{
      datetime: "2025-01-01T00:00:00.000Z",
      sum: 0,
    }, {
      datetime: "2025-02-01T00:00:00.000Z",
      sum: 0,
    }]);
  });

  it(`/GET passport metrics fails if user is not member of organization`, async () => {
    const { userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const response = await request(getApp(app))
      .get(
        `/organizations/${org2.id}/passport-metrics?templateId=${randomUUID()}&modelId=${randomUUID()}&startDate=2025-01-01T12:00:00Z&endDate=2025-01-01T13:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
