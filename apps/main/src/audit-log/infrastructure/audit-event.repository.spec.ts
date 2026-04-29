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

  it("should save a audit event", async () => {
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
    expect(foundEvents).toEqual([event1, event2]);
  });

  afterAll(async () => {
    await module.close();
  });
});
