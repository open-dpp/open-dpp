import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { beforeAll, expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";

import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";
import { ActivityRepository } from "./activity.repository";
import { ActivityDbSchema, ActivityDoc } from "./activity.schema";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { ActivityRegistriesInitializer } from "../presentation/activity-registry-initializer";
import { PagingResult } from "../../pagination/paging-result";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { Period } from "../../time/period";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { SubmodelActivity } from "../domain/activities/submodel.activity";
import { SubmodelOperationTypes } from "../domain/activities/submodel-operation-types";
import { AssetAdministrationShellActivity } from "../domain/activities/asset-administration-shell.activity";
import { AssetAdministrationShellOperationTypes } from "../domain/activities/asset-administration-shell-operation-types";
import { ActivityOldTypes } from "../domain/activities/activity-types";

describe("activityRepository", () => {
  let activityRepository: ActivityRepository;
  let module: TestingModule;

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
            name: ActivityDoc.name,
            schema: ActivityDbSchema,
          },
        ]),
      ],
      providers: [ActivityRegistriesInitializer, ActivityRepository],
    }).compile();

    await module.init();

    activityRepository = module.get<ActivityRepository>(ActivityRepository);
  });

  it("should save a activities", async () => {
    const passportId = randomUUID();
    const submodelId = randomUUID();
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const event1 = SubmodelActivity.create({
      digitalProductDocumentId: passportId,
      submodelId,
      fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop1` }),
      oldData: { idShort: "prop1", value: "oldValue" },
      newData: { idShort: "prop1", value: "newValue" },
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModified,
      createdAt: date1,
    });
    const event2 = SubmodelActivity.create({
      digitalProductDocumentId: passportId,
      submodelId,
      fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop2` }),
      oldData: { idShort: "prop2", value: "oldValue" },
      newData: { idShort: "prop2", value: "newValue" },
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModified,
      createdAt: date2,
    });
    const activities = [event1, event2];
    activities.forEach((activity) => activity.header.assignCorrelationId(randomUUID()));
    await activityRepository.createMany(activities);
    const foundEvent = await activityRepository.findOneOrFail(event1.header.id);
    expect(foundEvent).toEqual(event1);
    expect(foundEvent).toBeInstanceOf(SubmodelActivity);

    const foundEvents = await activityRepository.findByAggregateId(event1.header.aggregateId);
    expect(foundEvents.items).toEqual([event2, event1]);
  });

  it("should delete a activities by aggregation id", async () => {
    const passportId = randomUUID();
    const submodelId = randomUUID();
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const event1 = SubmodelActivity.create({
      digitalProductDocumentId: passportId,
      submodelId,
      fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop1` }),
      oldData: { idShort: "prop1", value: "oldValue" },
      newData: { idShort: "prop1", value: "newValue" },
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModified,
      createdAt: date1,
    });
    const event2 = SubmodelActivity.create({
      digitalProductDocumentId: passportId,
      submodelId,
      fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop2` }),
      oldData: { idShort: "prop2", value: "oldValue" },
      newData: { idShort: "prop2", value: "newValue" },
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModified,
      createdAt: date2,
    });
    const activities = [event1, event2];
    activities.forEach((activity) => activity.header.assignCorrelationId(randomUUID()));
    await activityRepository.createMany(activities);
    await activityRepository.deleteByAggregateId(passportId);
    const foundEvent1 = await activityRepository.findOne(event1.header.id);
    expect(foundEvent1).toBeUndefined();

    const foundEvent2 = await activityRepository.findOne(event2.header.id);
    expect(foundEvent2).toBeUndefined();
  });

  describe("should find activities", () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-02T00:00:00.000Z");
    const date5 = new Date("2022-03-03T00:00:00.000Z");
    const date6 = new Date("2022-04-03T00:00:00.000Z");

    const submodelId = randomUUID();
    const submodelIdShort = "submodelIdShort";
    const passportId = randomUUID();
    const createActivity = (idShort: string, createdAt: Date) =>
      SubmodelActivity.create({
        digitalProductDocumentId: passportId,
        submodelId,
        fullIdShortPath: IdShortPath.create({ path: `${submodelIdShort}.${idShort}` }),
        oldData: { submodelElements: [{ idShort, value: "oldValue" }] },
        newData: { submodelElements: [{ idShort, value: "newValue" }] },
        administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
        operation: SubmodelOperationTypes.SubmodelElementModified,
        createdAt,
      });

    const event1 = createActivity("prop1", date1);

    const event2 = createActivity("prop2", date2);
    const event3 = createActivity("prop3", date3);

    const event4 = createActivity("prop5", date5);

    const eventOfOtherAggregate = SubmodelActivity.create({
      digitalProductDocumentId: randomUUID(),
      submodelId: randomUUID(),
      fullIdShortPath: IdShortPath.create({ path: `${submodelIdShort}.prop4` }),
      oldData: { idShort: "prop4", value: "oldValue" },
      newData: { idShort: "prop4", value: "newValue" },
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModified,
      createdAt: date4,
    });

    const aasActivity = AssetAdministrationShellActivity.create({
      digitalProductDocumentId: passportId,
      assetAdministrationShellId: randomUUID(),
      oldData: { value: "oldValue" },
      newData: { value: "newValue" },
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: AssetAdministrationShellOperationTypes.AssetAdministrationShellModified,
      createdAt: date6,
    });

    beforeAll(async () => {
      const activities = [event1, event2, event3, eventOfOtherAggregate, event4, aasActivity];
      activities.forEach((activity) => activity.header.assignCorrelationId(randomUUID()));
      await activityRepository.createMany(activities);
    });

    it("using filter", async () => {
      let foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: { activityType: ActivityOldTypes.SubmodelActivity },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
            limit: 100,
          }),
          items: [event4, event3, event2, event1],
        }),
      );

      foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: { activityType: ActivityOldTypes.SubmodelActivity, dppPath: "prop1" },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
            limit: 100,
          }),
          items: [event1],
        }),
      );

      foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: { activityType: ActivityOldTypes.SubmodelActivity, dppPath: "sw:prop" },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
            limit: 100,
          }),
          items: [event4, event3, event2, event1],
        }),
      );

      foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: {
          activityType: ActivityOldTypes.SubmodelActivity,
          commandPath: `${submodelIdShort}.prop2`,
        },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event2.header.createdAt.toISOString(), event2.header.id),
            limit: 100,
          }),
          items: [event2],
        }),
      );

      foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: {
          activityType: ActivityOldTypes.SubmodelActivity,
          commandPath: `${submodelIdShort}.prop2`,
          dppPath: "sw:prop",
        },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event2.header.createdAt.toISOString(), event2.header.id),
            limit: 100,
          }),
          items: [event2],
        }),
      );

      foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: {
          activityType: ActivityOldTypes.SubmodelActivity,
          commandPath: `${submodelIdShort}`,
        },
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            limit: 100,
          }),
          items: [],
        }),
      );
    });

    it("using pagination", async () => {
      let foundEvents = await activityRepository.findByAggregateId(passportId);
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
            limit: 100,
          }),
          items: [aasActivity, event4, event3, event2, event1],
        }),
      );

      let pagination = Pagination.create({
        cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
      });
      foundEvents = await activityRepository.findByAggregateId(passportId, {
        pagination,
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
          }),
          items: [event2, event1],
        }),
      );

      pagination = Pagination.create({
        cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
        limit: 1,
      });
      foundEvents = await activityRepository.findByAggregateId(passportId, {
        pagination,
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event2.header.createdAt.toISOString(), event2.header.id),
            limit: 1,
          }),
          items: [event2],
        }),
      );
    });
    it("using period", async () => {
      let foundEvents = await activityRepository.findByAggregateId(passportId, {
        period: Period.fromIso({ start: date1.toISOString(), end: date3.toISOString() }),
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
            limit: 100,
          }),
          items: [event3, event2, event1],
        }),
      );

      let pagination = Pagination.create({
        cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
      });
      foundEvents = await activityRepository.findByAggregateId(passportId, {
        period: Period.fromIso({ start: date1.toISOString(), end: date3.toISOString() }),
        pagination,
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
          }),
          items: [event2, event1],
        }),
      );
    });

    it("using period ascending", async () => {
      let foundEvents = await activityRepository.findByAggregateId(passportId, {
        period: Period.fromIso({ start: date1.toISOString(), end: date3.toISOString() }),
        ascending: true,
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
            limit: 100,
          }),
          items: [event1, event2, event3],
        }),
      );

      let pagination = Pagination.create({
        cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
      });
      foundEvents = await activityRepository.findByAggregateId(passportId, {
        period: Period.fromIso({ start: date1.toISOString(), end: date3.toISOString() }),
        pagination,
        ascending: true,
      });
      expect(foundEvents).toEqual(
        PagingResult.create({
          pagination: Pagination.create({
            cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
          }),
          items: [event2, event3],
        }),
      );
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
