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
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../identity/users/application/services/users.service";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template } from "../../old-templates/domain/template";
import { laptopFactory } from "../../old-templates/fixtures/laptop.factory";
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
  let modelsService: ModelsService;
  let passportMetricService: PassportMetricService;
  let module: TestingModule;

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
        ]),
        AnalyticsModule,
        AuthModule,
      ],
      providers: [
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
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
    modelsService = module.get<ModelsService>(ModelsService);
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);

    await passportMetricService.findOne(
      {
        modelId: randomUUID(),
        type: MeasurementType.PAGE_VIEWS,
        templateId: randomUUID(),
        organizationId: randomUUID(),
      },
      new Date(),
    );
  });

  it("/POST should create page view metric", async () => {
    const { org, user, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = Template.loadFromDb(
      laptopFactory.build({ organizationId: org.id, userId: user.id }),
    );
    const model = Model.create({
      name: "My product",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const uniqueProductIdentifier = model.createUniqueProductIdentifier();

    await modelsService.save(model);

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
      organizationId: model.ownedByOrganizationId,
      templateId: model.templateId,
      modelId: model.id,
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
      modelId: randomUUID(),
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
        `/organizations/${org.id}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T00:00:00Z&endDate=2025-03-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
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
      modelId: randomUUID(),
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
        `/organizations/${org2.id}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T00:00:00Z&endDate=2025-02-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
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
