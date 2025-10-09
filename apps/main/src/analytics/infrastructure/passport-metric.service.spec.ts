import { randomUUID } from "node:crypto";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { MongooseTestingModule } from "@open-dpp/testing";
import { Connection } from "mongoose";
import { MeasurementType, PassportMetric } from "../domain/passport-metric";
import { PassportMetricAggregation } from "../domain/passport-metric-aggregation";
import {
  dataFieldFactory,
  passportMetricFactory,
} from "../fixtures/passport-metric.factory";
import {
  PassportMetricDoc,
  PassportMetricSchema,
} from "./passport-metric.schema";

import { PassportMetricService, TimePeriod } from "./passport-metric.service";

describe("passportMetricService", () => {
  let passportMetricService: PassportMetricService;
  let mongoConnection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportMetricDoc.name,
            schema: PassportMetricSchema,
          },
        ]),
      ],
      providers: [PassportMetricService],
    }).compile();

    passportMetricService = module.get<PassportMetricService>(
      PassportMetricService,
    );
    mongoConnection = module.get<Connection>(getConnectionToken());
    // This findOne is important to ensure that the collection with its timeseries buckets is created. Otherwise, the test will fail.
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

  it("should create and modify passport metric", async () => {
    const passportMetric = PassportMetric.loadFromDb(
      passportMetricFactory.build({
        date: new Date(Date.now()),
        values: [
          { key: "v1", row: 1, value: 7 },
          { key: "v2", row: 2, value: 90 },
        ],
      }),
    );

    await passportMetricService.create(passportMetric);

    const source = {
      modelId: passportMetric.source.modelId,
      organizationId: passportMetric.source.organizationId,
      templateId: passportMetric.source.templateId,
      type: passportMetric.source.type,
    };

    const foundPassportMetric = await passportMetricService.findOneOrFail(
      source,
      passportMetric.date,
    );

    expect(foundPassportMetric).toEqual(passportMetric);
    foundPassportMetric.upsertMetricValue({ key: "v3", row: 1, value: 11 });
    await passportMetricService.create(foundPassportMetric);
    expect(foundPassportMetric.values).toEqual([
      ...passportMetric.values,
      { key: "v3", row: 1, value: 11 },
    ]);
  });

  it("fails if requested passport metric could not be found", async () => {
    await expect(
      passportMetricService.findOneOrFail(
        {
          modelId: randomUUID(),
          type: MeasurementType.PAGE_VIEWS,
          organizationId: randomUUID(),
          templateId: randomUUID(),
        },
        new Date(),
      ),
    ).rejects.toThrow(new NotFoundInDatabaseException(PassportMetric.name));
  });

  it("get passport page view statistic", async () => {
    const source = {
      modelId: randomUUID(),
      organizationId: randomUUID(),
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

    const date6 = new Date("2025-03-01T12:00:00Z");
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

    const statistic = await passportMetricService.computeStatistic(
      PassportMetricAggregation.create({
        ...source,
        type: MeasurementType.PAGE_VIEWS,
        valueKey: "http://example.com",
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-03-01T13:00:00Z"),
        timezone: "UTC",
      }),
      TimePeriod.MONTH,
    );
    expect(statistic).toEqual([
      {
        datetime: new Date("2025-01-01T00:00:00.000Z"),
        sum: 3,
      },
      {
        datetime: new Date("2025-02-01T00:00:00.000Z"),
        sum: 2,
      },
      {
        datetime: new Date("2025-03-01T00:00:00.000Z"),
        sum: 1,
      },
    ]);

    // statistic = await passportMetricService.computeStatistic(
    //   PassportMetricFilter.create({
    //     type: MeasurementType.PAGE_VIEWS,
    //     valueKey: page,
    //     templateId,
    //     organizationId: ownedByOrganizationId,
    //     startDate: new Date('2025-01-01T12:00:00Z'),
    //     endDate: new Date('2025-02-01T13:00:00Z'),
    //   }),
    //   TimePeriod.MONTH,
    // );
    // expect(statistic).toEqual([
    //   {
    //     datetime: new Date('2025-01-01T00:00:00.000Z'),
    //     sum: 3,
    //   },
    //   {
    //     datetime: new Date('2025-02-01T00:00:00.000Z'),
    //     sum: 2,
    //   },
    // ]);
  });

  it("get passport field value statistic", async () => {
    const source = {
      modelId: randomUUID(),
      organizationId: randomUUID(),
      templateId: randomUUID(),
    };
    const dataSectionId = randomUUID();
    const dataFieldId1 = randomUUID();
    const dataFieldId2 = randomUUID();
    const dataFieldId3 = randomUUID();
    const fieldValues1 = [
      dataFieldFactory.build({
        value: 8,
        dataSectionId,
        dataFieldId: dataFieldId1,
      }),
      dataFieldFactory.build({
        value: 3,
        dataSectionId,
        dataFieldId: dataFieldId2,
      }),
      dataFieldFactory.build({
        value: 5,
        dataSectionId,
        dataFieldId: dataFieldId3,
      }),
    ];
    const date1 = new Date("2025-01-01T12:00:00Z");
    const passportMetric1 = PassportMetric.createFieldAggregate({
      source,
      fieldValues: fieldValues1,
      date: date1,
    });
    const fieldValues2 = [
      dataFieldFactory.build({
        value: 2,
        dataSectionId,
        dataFieldId: dataFieldId1,
      }),
      dataFieldFactory.build({
        value: 4,
        dataSectionId,
        dataFieldId: dataFieldId2,
      }),
    ];
    const date2 = new Date("2025-02-01T12:00:00Z");
    const passportMetric2 = PassportMetric.createFieldAggregate({
      source,
      fieldValues: fieldValues2,
      date: date2,
    });
    const fieldValues3 = [
      dataFieldFactory.build({
        value: 102,
        dataSectionId,
        dataFieldId: dataFieldId1,
      }),
      dataFieldFactory.build({
        value: 90,
        dataSectionId,
        dataFieldId: dataFieldId3,
      }),
    ];
    const date3 = new Date("2025-01-01T13:00:00Z");
    const passportMetric3 = PassportMetric.createFieldAggregate({
      source,
      fieldValues: fieldValues3,
      date: date3,
    });

    await passportMetricService.create(passportMetric1);
    await passportMetricService.create(passportMetric2);
    await passportMetricService.create(passportMetric3);

    let statistic = await passportMetricService.computeStatistic(
      PassportMetricAggregation.create({
        ...source,
        type: MeasurementType.FIELD_AGGREGATE,
        valueKey: dataFieldId1,
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-03-01T13:00:00Z"),
        timezone: "UTC",
      }),
      TimePeriod.MONTH,
    );
    expect(statistic).toEqual([
      {
        datetime: new Date("2025-01-01T00:00:00.000Z"),
        sum: 110,
      },
      {
        datetime: new Date("2025-02-01T00:00:00.000Z"),
        sum: 2,
      },
    ]);

    statistic = await passportMetricService.computeStatistic(
      PassportMetricAggregation.create({
        ...source,
        type: MeasurementType.FIELD_AGGREGATE,
        valueKey: dataFieldId2,
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-03-01T13:00:00Z"),
        timezone: "UTC",
      }),
      TimePeriod.MONTH,
    );
    expect(statistic).toEqual([
      {
        datetime: new Date("2025-01-01T00:00:00.000Z"),
        sum: 3,
      },
      {
        datetime: new Date("2025-02-01T00:00:00.000Z"),
        sum: 4,
      },
    ]);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
