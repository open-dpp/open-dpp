import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { Quota } from "../domain/quota";
import { QuotaRepository } from "./quota.repository";
import { QuotaDoc, QuotaSchema } from "./quota.schema";
import { PolicyKeyList } from "@open-dpp/dto";

describe("quotaRepository", () => {
  let quotaRepository: QuotaRepository;
  let module: TestingModule;

  const newQuota = (organizationId: string) =>
    Quota.create({
      organizationId,
      key: PolicyKeyList.AI_TOKEN_QUOTA,
      limit: 100,
      period: "month",
    });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (envService: EnvService) => ({ ...generateMongoConfig(envService) }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([{ name: QuotaDoc.name, schema: QuotaSchema }]),
      ],
      providers: [QuotaRepository],
    }).compile();

    quotaRepository = module.get<QuotaRepository>(QuotaRepository);
  });

  it("should save a quota with its counter and period and read it back", async () => {
    const organizationId = randomUUID();
    const quota = newQuota(organizationId);
    quota.increment(3);

    await quotaRepository.update(quota);

    const found = await quotaRepository.findOneByOrganizationIdAndKeyOrFail(
      organizationId,
      PolicyKeyList.AI_TOKEN_QUOTA,
    );
    expect(found?.getLimit()).toBe(100);
    expect(found?.getCount()).toBe(3);
    expect(found?.getPeriod()).toBe("month");
    expect(found?.getLastReset()).toBeInstanceOf(Date);
  });

  it("should persist an incremented counter over the previous document", async () => {
    const organizationId = randomUUID();
    const quota = newQuota(organizationId);

    await quotaRepository.update(quota);
    quota.increment(7);
    await quotaRepository.update(quota);

    const all = await quotaRepository.findAllByOrganizationId(organizationId);
    expect(all).toHaveLength(1);
    expect(all[0].getCount()).toBe(7);
  });

  it("should persist a reset counter", async () => {
    const organizationId = randomUUID();
    const quota = newQuota(organizationId);
    quota.increment(9);
    await quotaRepository.update(quota);

    quota.reset();
    await quotaRepository.update(quota);

    const found = await quotaRepository.findOneByOrganizationIdAndKeyOrFail(
      organizationId,
      PolicyKeyList.AI_TOKEN_QUOTA,
    );
    expect(found?.getCount()).toBe(0);
  });

  it("should return undefined when no quota is stored", async () => {
    await expect(
      quotaRepository.findOneByOrganizationIdAndKey(randomUUID(), PolicyKeyList.AI_TOKEN_QUOTA),
    ).resolves.toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
