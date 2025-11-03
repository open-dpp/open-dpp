import { randomUUID } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import {
  getApp,
  MongooseTestingModule,
} from "@open-dpp/testing";
import { Connection } from "mongoose";
import request from "supertest";
import { BetterAuthTestingGuard, getBetterAuthToken } from "../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { EmailService } from "../../email/email.service";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template } from "../../templates/domain/template";
import { laptopFactory } from "../../templates/fixtures/laptop.factory";
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
  let mongoConnection: Connection;
  const reflector: Reflector = new Reflector();
  const betterAuthTestingGuard = new BetterAuthTestingGuard(reflector);
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
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
      ],
      providers: [
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
        ModelsService,
        ItemsService,
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
            getUserById: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useValue: betterAuthTestingGuard,
        },
      ],
      controllers: [PassportMetricController],
    }).compile();

    mongoConnection = module.get<Connection>(getConnectionToken());
    passportMetricService = module.get<PassportMetricService>(
      PassportMetricService,
    );
    modelsService = module.get<ModelsService>(ModelsService);
    app = module.createNestApplication();
    await app.init();
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

  beforeEach(() => {
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("/POST should create page view metric", async () => {
    jest.spyOn(reflector, "get").mockReturnValue(true);
    const template = Template.loadFromDb(
      laptopFactory.build({ organizationId: TestUsersAndOrganizations.organizations.org1.id, userId: TestUsersAndOrganizations.users.user1.id }),
    );
    const model = Model.create({
      name: "My product",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const uniqueProductIdentifier = model.createUniqueProductIdentifier();

    await modelsService.save(model);

    const page = "http://example.com/page";
    const response: { status: number; body: { id: string } } = await request(
      getApp(app),
    )
      .post(`/passport-metrics/page-views`)
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
    const templateId = randomUUID();
    const date1 = new Date("2025-01-01T13:00:00Z");
    const date2 = new Date("2025-01-01T14:00:00Z");
    const source = {
      templateId,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T00:00:00Z&endDate=2025-03-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
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
    const templateId = randomUUID();
    const date = new Date("2025-01-01T13:00:00Z");
    const source = {
      templateId,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/passport-metrics?templateId=${templateId}&modelId=${source.modelId}&startDate=2025-01-01T00:00:00Z&endDate=2025-02-01T00:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user2.id,
        ),
      )
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
    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/passport-metrics?templateId=${randomUUID()}&modelId=${randomUUID()}&startDate=2025-01-01T12:00:00Z&endDate=2025-01-01T13:00:00Z&type=${MeasurementType.PAGE_VIEWS}&valueKey=http://example.com/page1&period=${TimePeriod.MONTH}`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send();
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
    await app.close();
  });
});
