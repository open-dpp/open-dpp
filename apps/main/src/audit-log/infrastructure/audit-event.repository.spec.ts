import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";

import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";
import { AuditEventRepository } from "./audit-event.repository";
import { AuditEventDbSchema, AuditEventDoc } from "./audit-event.schema";
import {
  SubmodelElementModificationEvent,
  SubmodelElementModificationEventPayload,
} from "../aas/submodel-element-modification.event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { AuditEventRegistryInitializer } from "../presentation/audit-event-registry-initializer";
import { PagingResult } from "../../pagination/paging-result";
import { encodeCursor, Pagination } from "../../pagination/pagination";

describe("auditEventRepository", () => {
  let auditEventRepository: AuditEventRepository;
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
            name: AuditEventDoc.name,
            schema: AuditEventDbSchema,
          },
        ]),
      ],
      providers: [AuditEventRegistryInitializer, AuditEventRepository],
    }).compile();

    await module.init();

    auditEventRepository = module.get<AuditEventRepository>(AuditEventRepository);
  });

  it("should save a audit events", async () => {
    const submodelId = randomUUID();
    const event1 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop1` }),
      }),
    });
    const event2 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop2` }),
      }),
    });
    await auditEventRepository.createMany([event1, event2]);
    const foundEvent = await auditEventRepository.findOneOrFail(event1.header.id);
    expect(foundEvent).toEqual(event1);
    expect(foundEvent).toBeInstanceOf(SubmodelElementModificationEvent);

    const foundEvents = await auditEventRepository.findByAggregateId(event1.header.aggregateId);
    expect(foundEvents.items).toEqual([event1, event2]);
  });

  it("should find a audit event using pagination", async () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-02T00:00:00.000Z");
    const date5 = new Date("2022-03-03T00:00:00.000Z");
    const submodelId = randomUUID();

    const event1 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${randomUUID()}.prop1` }),
      }),
      createdAt: date1,
    });

    const event2 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${randomUUID()}.prop2` }),
      }),
      createdAt: date2,
    });
    const event3 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${randomUUID()}.prop3` }),
      }),
      createdAt: date3,
    });
    const eventOfOtherAggregate = SubmodelElementModificationEvent.create({
      submodelId: randomUUID(),
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${randomUUID()}.prop4` }),
      }),
      createdAt: date4,
    });
    const event4 = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${randomUUID()}.prop4` }),
      }),
      createdAt: date5,
    });
    await auditEventRepository.createMany([event1, event2, event3, eventOfOtherAggregate, event4]);
    let foundEvents = await auditEventRepository.findByAggregateId(submodelId);
    expect(foundEvents).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(event1.header.createdAt.toISOString(), event1.header.id),
          limit: 100,
        }),
        items: [event4, event3, event2, event1],
      }),
    );

    let pagination = Pagination.create({
      cursor: encodeCursor(event3.header.createdAt.toISOString(), event3.header.id),
    });
    foundEvents = await auditEventRepository.findByAggregateId(submodelId, {
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
    foundEvents = await auditEventRepository.findByAggregateId(submodelId, {
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

  afterAll(async () => {
    await module.close();
  });
});
