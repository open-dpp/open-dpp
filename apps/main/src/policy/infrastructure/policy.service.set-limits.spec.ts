import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { Limit } from "../domain/limit";
import type { PolicyKey } from "../domain/policy-rules";
import { PolicyKeyList } from "../domain/policy-rules";
import { Quota } from "../domain/quota";
import { LimitEvaluatorService } from "./limit-evaluator.service";
import { LimitRepository } from "./limit.repository";
import { PolicyService } from "./policy.service";
import { QuotaRepository } from "./quota.repository";

const ORGANIZATION_ID = "org-1";

describe("policyService.setLimits", () => {
  let service: PolicyService;
  let storedLimits: Map<PolicyKey, Limit>;
  let storedQuotas: Map<PolicyKey, Quota>;

  beforeEach(async () => {
    storedLimits = new Map([
      [
        PolicyKeyList.MEDIA_STORAGE_LIMIT,
        Limit.create({
          organizationId: ORGANIZATION_ID,
          key: PolicyKeyList.MEDIA_STORAGE_LIMIT,
          limit: 100,
        }),
      ],
      [
        PolicyKeyList.PASSPORT_CREATE_LIMIT,
        Limit.create({
          organizationId: ORGANIZATION_ID,
          key: PolicyKeyList.PASSPORT_CREATE_LIMIT,
          limit: 20,
        }),
      ],
    ]);
    storedQuotas = new Map([
      [
        PolicyKeyList.AI_TOKEN_QUOTA,
        Quota.loadFromDb({
          organizationId: ORGANIZATION_ID,
          key: PolicyKeyList.AI_TOKEN_QUOTA,
          limit: 1000,
          count: 42,
          period: "month",
          lastSetBack: new Date(),
        }),
      ],
    ]);

    const findOrFail = <T>(store: Map<PolicyKey, T>, key: PolicyKey): T => {
      const found = store.get(key);
      if (!found) {
        throw new NotFoundInDatabaseException("Policy");
      }
      return found;
    };

    const limitRepository = {
      findOneByOrganizationIdAndKeyOrFail: jest.fn(async (_orgId: string, key: PolicyKey) =>
        findOrFail(storedLimits, key),
      ),
      save: jest.fn(async (limit: Limit) => {
        storedLimits.set(limit.getKey(), limit);
        return limit;
      }),
    };
    const quotaRepository = {
      findOneByOrganizationIdAndKeyOrFail: jest.fn(async (_orgId: string, key: PolicyKey) =>
        findOrFail(storedQuotas, key),
      ),
      save: jest.fn(async (quota: Quota) => {
        storedQuotas.set(quota.getKey(), quota);
        return quota;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: LimitRepository, useValue: limitRepository },
        { provide: QuotaRepository, useValue: quotaRepository },
        { provide: EnvService, useValue: { get: jest.fn(() => 0) } },
        { provide: LimitEvaluatorService, useValue: { getCurrent: jest.fn(async () => 5) } },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  it("sets the limit of a plain limit key", async () => {
    await service.setLimits(ORGANIZATION_ID, { [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 });

    expect(storedLimits.get(PolicyKeyList.MEDIA_STORAGE_LIMIT)!.getLimit()).toBe(500);
  });

  it("sets the limit of a quota key without disturbing its counter or period", async () => {
    await service.setLimits(ORGANIZATION_ID, { [PolicyKeyList.AI_TOKEN_QUOTA]: 2000 });

    const quota = storedQuotas.get(PolicyKeyList.AI_TOKEN_QUOTA)!;
    expect(quota.getLimit()).toBe(2000);
    expect(quota.getCount()).toBe(42);
    expect(quota.getPeriod()).toBe("month");
  });

  it("sets several keys in one call", async () => {
    await service.setLimits(ORGANIZATION_ID, {
      [PolicyKeyList.AI_TOKEN_QUOTA]: 2000,
      [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
      [PolicyKeyList.PASSPORT_CREATE_LIMIT]: 60,
    });

    expect(storedQuotas.get(PolicyKeyList.AI_TOKEN_QUOTA)!.getLimit()).toBe(2000);
    expect(storedLimits.get(PolicyKeyList.MEDIA_STORAGE_LIMIT)!.getLimit()).toBe(500);
    expect(storedLimits.get(PolicyKeyList.PASSPORT_CREATE_LIMIT)!.getLimit()).toBe(60);
  });

  it("leaves keys that were not given untouched", async () => {
    await service.setLimits(ORGANIZATION_ID, { [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 });

    expect(storedLimits.get(PolicyKeyList.PASSPORT_CREATE_LIMIT)!.getLimit()).toBe(20);
    expect(storedQuotas.get(PolicyKeyList.AI_TOKEN_QUOTA)!.getLimit()).toBe(1000);
  });

  it("returns the utilization of every policy after the change", async () => {
    const utilization = await service.setLimits(ORGANIZATION_ID, {
      [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
    });

    expect(Object.keys(utilization).sort()).toEqual(Object.values(PolicyKeyList).sort());
    expect(utilization[PolicyKeyList.MEDIA_STORAGE_LIMIT]).toEqual({ limit: 500, used: 5 });
    expect(utilization[PolicyKeyList.AI_TOKEN_QUOTA]).toEqual(
      expect.objectContaining({ limit: 1000, used: 42 }),
    );
  });

  it("accepts 0, which means unlimited", async () => {
    await service.setLimits(ORGANIZATION_ID, { [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 0 });

    expect(storedLimits.get(PolicyKeyList.MEDIA_STORAGE_LIMIT)!.getLimit()).toBe(0);
  });

  it("rejects a negative limit", async () => {
    await expect(
      service.setLimits(ORGANIZATION_ID, { [PolicyKeyList.MEDIA_STORAGE_LIMIT]: -1 }),
    ).rejects.toThrow(ValueError);
    expect(storedLimits.get(PolicyKeyList.MEDIA_STORAGE_LIMIT)!.getLimit()).toBe(100);
  });

  it("fails when the organization has no policy stored for the key", async () => {
    storedLimits.clear();

    await expect(
      service.setLimits("unknown-org", { [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 }),
    ).rejects.toThrow(NotFoundInDatabaseException);
  });
});
