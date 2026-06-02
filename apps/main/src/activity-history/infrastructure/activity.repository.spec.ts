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
import { SubmodelElementModifiedActivity } from "../domain/activities/submodel-element-modified.activity";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { ChangeTracker } from "../domain/change-tracker";
import { PropertyValueChanged } from "../domain/change-events/property-value-changed";
import { DataTypeDef } from "@open-dpp/dto";
import { AssetAdministrationShellModifiedActivity } from "../domain/activities/asset-administration-shell-modified.activity";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { DisplayNameChanged } from "../domain/change-events/language-text-collection-changed";
import { LanguageText } from "../../aas/domain/common/language-text";
import { ActivityTypes } from "../domain/activities/activity-types";

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
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const submodel = Submodel.create({
      idShort: "submodel1",
    });
    const event1 = SubmodelElementModifiedActivity.create({
      digitalProductDocumentId: passportId,
      submodel: submodel.withTracking(
        ChangeTracker.fromChanges([
          PropertyValueChanged.create({
            path: IdShortPath.create({ path: "prop1" }),
            valueType: DataTypeDef.String,
            oldValue: "oldValue",
            newValue: "newValue",
          }),
        ]),
      ),
      createdAt: date1,
      correlationId: randomUUID(),
    });
    const event2 = SubmodelElementModifiedActivity.create({
      digitalProductDocumentId: passportId,
      submodel: submodel.withTracking(
        ChangeTracker.fromChanges([
          PropertyValueChanged.create({
            path: IdShortPath.create({ path: "prop2" }),
            valueType: DataTypeDef.String,
            oldValue: "oldValue",
            newValue: "newValue",
          }),
        ]),
      ),
      correlationId: randomUUID(),
      createdAt: date2,
    });
    const activities = [event1, event2];
    await activityRepository.createMany(activities);
    const foundEvent = await activityRepository.findOneOrFail(event1.header.id);
    expect(foundEvent).toEqual(event1);
    expect(foundEvent).toBeInstanceOf(SubmodelElementModifiedActivity);

    const foundEvents = await activityRepository.findByAggregateId(event1.header.aggregateId);
    expect(foundEvents.items).toEqual([event2, event1]);
  });

  it("should delete a activities by aggregation id", async () => {
    const passportId = randomUUID();
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const correlationId = randomUUID();

    const submodel = Submodel.create({
      idShort: "submodel1",
    });
    const event1 = SubmodelElementModifiedActivity.create({
      digitalProductDocumentId: passportId,
      submodel: submodel.withTracking(
        ChangeTracker.fromChanges([
          PropertyValueChanged.create({
            path: IdShortPath.create({ path: "prop1" }),
            valueType: DataTypeDef.String,
            oldValue: "oldValue",
            newValue: "newValue",
          }),
        ]),
      ),
      correlationId,
      createdAt: date1,
    });
    const event2 = SubmodelElementModifiedActivity.create({
      digitalProductDocumentId: passportId,
      submodel: submodel.withTracking(
        ChangeTracker.fromChanges([
          PropertyValueChanged.create({
            path: IdShortPath.create({ path: "prop2" }),
            valueType: DataTypeDef.String,
            oldValue: "oldValue",
            newValue: "newValue",
          }),
        ]),
      ),
      correlationId,
      createdAt: date2,
    });
    const activities = [event1, event2];
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

    const submodelIdShort = "submodelIdShort";
    const passportId = randomUUID();
    const submodel = Submodel.create({
      idShort: submodelIdShort,
    });
    const createActivity = (id: string, idShort: string, createdAt: Date) => {
      return SubmodelElementModifiedActivity.create({
        digitalProductDocumentId: id,
        submodel: submodel.withTracking(
          ChangeTracker.fromChanges([
            PropertyValueChanged.create({
              path: IdShortPath.create({ path: idShort }),
              valueType: DataTypeDef.String,
              oldValue: "oldValue",
              newValue: "newValue",
            }),
          ]),
        ),
        createdAt,
        correlationId: randomUUID(),
      });
    };
    const event1 = createActivity(passportId, "prop1", date1);

    const event2 = createActivity(passportId, "prop2", date2);
    const event3 = createActivity(passportId, "prop3", date3);

    const event4 = createActivity(passportId, "prop5", date5);

    const eventOfOtherAggregate = createActivity(randomUUID(), "prop6", date4);

    const aas = AssetAdministrationShell.create({});
    const changeTracker = ChangeTracker.create();
    changeTracker.track(
      DisplayNameChanged.create({
        path: IdShortPath.create({ path: aas.id }),
        oldValue: [],
        newValue: [
          LanguageText.create({
            language: "en",
            text: "newName",
          }),
        ],
      }),
    );
    const aasActivity = AssetAdministrationShellModifiedActivity.create({
      digitalProductDocumentId: passportId,
      correlationId: randomUUID(),
      aas: aas.withTracking(changeTracker),
      createdAt: date6,
    });

    beforeAll(async () => {
      const activities = [event1, event2, event3, eventOfOtherAggregate, event4, aasActivity];
      await activityRepository.createMany(activities);
    });

    it("using filter", async () => {
      let foundEvents = await activityRepository.findByAggregateId(passportId, {
        filter: { activityType: ActivityTypes.SubmodelElementModified },
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
        filter: { activityType: ActivityTypes.SubmodelElementModified, path: "prop1" },
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
        filter: { activityType: ActivityTypes.SubmodelElementModified, path: "sw:prop" },
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
