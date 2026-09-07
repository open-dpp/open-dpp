import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { Limit } from "../domain/limit";
import { LimitRepository } from "./limit.repository";
import { LimitDoc, LimitSchema } from "./limit.schema";
import { PolicyKeyList } from "@open-dpp/dto";

describe("limitRepository", () => {
  let limitRepository: LimitRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (envService: EnvService) => ({ ...generateMongoConfig(envService) }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([{ name: LimitDoc.name, schema: LimitSchema }]),
      ],
      providers: [LimitRepository],
    }).compile();

    limitRepository = module.get<LimitRepository>(LimitRepository);
  });

  it("should save a limit and read it back", async () => {
    const organizationId = randomUUID();

    await limitRepository.update(
      Limit.create({ organizationId, key: PolicyKeyList.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );

    const found = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
      organizationId,
      PolicyKeyList.PASSPORT_CREATE_LIMIT,
    );
    expect(found?.getLimit()).toBe(5);
    expect(found?.getKey()).toBe(PolicyKeyList.PASSPORT_CREATE_LIMIT);
    expect(found?.getOrganizationId()).toBe(organizationId);
  });

  it("should overwrite the limit of an existing organization and key pair", async () => {
    const organizationId = randomUUID();

    await limitRepository.update(
      Limit.create({ organizationId, key: PolicyKeyList.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );
    await limitRepository.update(
      Limit.create({ organizationId, key: PolicyKeyList.PASSPORT_CREATE_LIMIT, limit: 9 }),
    );

    const all = await limitRepository.findAllByOrganizationId(organizationId);
    expect(all).toHaveLength(1);
    expect(all[0].getLimit()).toBe(9);
  });

  it("should keep limits of different keys and organizations apart", async () => {
    const organizationId = randomUUID();
    const otherOrganizationId = randomUUID();

    await limitRepository.update(
      Limit.create({ organizationId, key: PolicyKeyList.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );
    await limitRepository.update(
      Limit.create({ organizationId, key: PolicyKeyList.MEDIA_STORAGE_LIMIT, limit: 200 }),
    );
    await limitRepository.update(
      Limit.create({
        organizationId: otherOrganizationId,
        key: PolicyKeyList.PASSPORT_CREATE_LIMIT,
        limit: 1,
      }),
    );

    const all = await limitRepository.findAllByOrganizationId(organizationId);
    expect(all.map((limit) => limit.getLimit()).sort()).toEqual([200, 5].sort());

    const other = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
      otherOrganizationId,
      PolicyKeyList.PASSPORT_CREATE_LIMIT,
    );
    expect(other?.getLimit()).toBe(1);
  });

  it("should return undefined when no limit is stored", async () => {
    await expect(
      limitRepository.findOneByOrganizationIdAndKey(
        randomUUID(),
        PolicyKeyList.PASSPORT_CREATE_LIMIT,
      ),
    ).resolves.toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
