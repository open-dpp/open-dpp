import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Auth } from "better-auth";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UsersModule } from "../../identity/users/users.module";
import { MeasurementType, PassportMetric } from "../domain/passport-metric";
import { TimePeriod } from "../domain/time-period";
import { PassportMetricDoc, PassportMetricSchema } from "./passport-metric.schema";
import { PassportMetricService } from "./passport-metric.service";

describe("passportMetricService", () => {
  let app: INestApplication;
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
            name: PassportMetricDoc.name,
            schema: PassportMetricSchema,
          },
        ]),
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      providers: [
        PassportMetricService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    passportMetricService = module.get<PassportMetricService>(PassportMetricService);
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();

    // This findOne is important to ensure that the collection with its timeseries buckets is created. Otherwise, the test will fail.
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    await passportMetricService.findOne(
      {
        passportId: randomUUID(),
        type: MeasurementType.PAGE_VIEWS,
        templateId: randomUUID(),
        organizationId: org.id,
      },
      new Date(),
    );
  });

  it("fails if requested passport metric could not be found", async () => {
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    await expect(
      passportMetricService.findOneOrFail(
        {
          passportId: randomUUID(),
          type: MeasurementType.PAGE_VIEWS,
          organizationId: org.id,
          templateId: randomUUID(),
        },
        new Date(),
      ),
    ).rejects.toThrow(new NotFoundInDatabaseException(PassportMetric.name));
  });

  it("get passport page view statistic", async () => {
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const source = {
      passportId: randomUUID(),
      organizationId: org.id,
      templateId: randomUUID(),
    };
    const page = "http://example.com/page1";
    const date1 = new Date("2025-01-01T12:00:00Z");
    const passportMetric1 = PassportMetric.createPageView({
      source,
      page,
      date: date1,
    });
    const date2 = new Date("2025-02-01T12:00:00Z");
    const passportMetric2 = PassportMetric.createPageView({
      source,
      page,
      date: date2,
    });
    const date3 = new Date("2025-01-01T13:00:00Z");
    const passportMetric3 = PassportMetric.createPageView({
      source,
      page,
      date: date3,
    });

    const date4 = new Date("2025-01-03T12:00:00Z");
    const passportMetric4 = PassportMetric.createPageView({
      source,
      page,
      date: date4,
    });

    const date5 = new Date("2025-02-01T13:00:00Z");
    const passportMetric5 = PassportMetric.createPageView({
      source,
      page,
      date: date5,
    });

    const date6 = new Date("2025-03-01T00:00:00Z");
    const passportMetric6 = PassportMetric.createPageView({
      source,
      page,
      date: date6,
    });
    const passportMetric6Updated = PassportMetric.createPageView({
      source,
      page,
      date: date6,
    });
    await passportMetricService.create(passportMetric1);
    await passportMetricService.create(passportMetric2);
    await passportMetricService.create(passportMetric3);
    await passportMetricService.create(passportMetric4);
    await passportMetricService.create(passportMetric5);
    await passportMetricService.create(passportMetric6);
    await passportMetricService.create(passportMetric6Updated);

    const statistic = await passportMetricService.computeStatistic(source.organizationId, {
      templateId: source.templateId,
      passportId: source.passportId,
      type: MeasurementType.PAGE_VIEWS,
      valueKey: "http://example.com",
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-03-01T00:00:00Z"),
      period: TimePeriod.MONTH,
    });
    expect(statistic).toEqual([
      {
        datetime: "2025-01-01T00:00:00.000Z",
        sum: 3,
      },
      {
        datetime: "2025-02-01T00:00:00.000Z",
        sum: 2,
      },
      {
        datetime: "2025-03-01T00:00:00.000Z",
        sum: 1,
      },
    ]);
  });

  afterAll(async () => {
    await module.close();
  });
});
