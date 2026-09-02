import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { Limit } from "../domain/limit";
import { PolicyKey } from "../domain/policy-rules";
import { LimitRepository } from "./limit.repository";
import { LimitDoc, LimitSchema } from "./limit.schema";

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

    await limitRepository.save(
      Limit.create({ organizationId, key: PolicyKey.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );

    const found = await limitRepository.findOneByOrganizationIdAndKey(
      organizationId,
      PolicyKey.PASSPORT_CREATE_LIMIT,
    );
    expect(found?.getLimit()).toBe(5);
    expect(found?.getKey()).toBe(PolicyKey.PASSPORT_CREATE_LIMIT);
    expect(found?.getOrganizationId()).toBe(organizationId);
  });

  it("should overwrite the limit of an existing organization and key pair", async () => {
    const organizationId = randomUUID();

    await limitRepository.save(
      Limit.create({ organizationId, key: PolicyKey.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );
    await limitRepository.save(
      Limit.create({ organizationId, key: PolicyKey.PASSPORT_CREATE_LIMIT, limit: 9 }),
    );

    const all = await limitRepository.findAllByOrganizationId(organizationId);
    expect(all).toHaveLength(1);
    expect(all[0].getLimit()).toBe(9);
  });

  it("should keep limits of different keys and organizations apart", async () => {
    const organizationId = randomUUID();
    const otherOrganizationId = randomUUID();

    await limitRepository.save(
      Limit.create({ organizationId, key: PolicyKey.PASSPORT_CREATE_LIMIT, limit: 5 }),
    );
    await limitRepository.save(
      Limit.create({ organizationId, key: PolicyKey.MEDIA_STORAGE_LIMIT, limit: 200 }),
    );
    await limitRepository.save(
      Limit.create({
        organizationId: otherOrganizationId,
        key: PolicyKey.PASSPORT_CREATE_LIMIT,
        limit: 1,
      }),
    );

    const all = await limitRepository.findAllByOrganizationId(organizationId);
    expect(all.map((limit) => limit.getLimit()).sort()).toEqual([200, 5].sort());

    const other = await limitRepository.findOneByOrganizationIdAndKey(
      otherOrganizationId,
      PolicyKey.PASSPORT_CREATE_LIMIT,
    );
    expect(other?.getLimit()).toBe(1);
  });

  it("should return undefined when no limit is stored", async () => {
    await expect(
      limitRepository.findOneByOrganizationIdAndKey(randomUUID(), PolicyKey.PASSPORT_CREATE_LIMIT),
    ).resolves.toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
