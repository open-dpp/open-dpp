import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { Limit } from "../../domain/limit";
import { Quota } from "../../domain/quota";
import { LimitEvaluatorService } from "../../infrastructure/limit-evaluator.service";
import { LimitRepository } from "../../infrastructure/limit.repository";
import { PolicyService } from "../../infrastructure/policy.service";
import { QuotaRepository } from "../../infrastructure/quota.repository";
import { type PolicyKey, PolicyKeyList } from "@open-dpp/dto";
import { PolicyDefinitions } from "../../domain/policy-rules";
import { PolicyManagementService } from "./policy-management.service";

const ORGANIZATION_ID = "org-1";

describe("PolicyManagementService", () => {
  describe("ensureDefaultPolicies", () => {
    let service: PolicyManagementService;
    let limitRepository: any;
    let quotaRepository: any;
    let envService: any;

    beforeEach(async () => {
      limitRepository = {
        findOneByOrganizationIdAndKey: jest.fn(),
        update: jest.fn(),
      };
      quotaRepository = {
        findOneByOrganizationIdAndKey: jest.fn(),
        update: jest.fn(),
      };
      envService = {
        get: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyManagementService,
          PolicyService,
          { provide: LimitRepository, useValue: limitRepository },
          { provide: QuotaRepository, useValue: quotaRepository },
          { provide: EnvService, useValue: envService },
          { provide: LimitEvaluatorService, useValue: { getCurrent: jest.fn() } },
        ],
      }).compile();

      service = module.get<PolicyManagementService>(PolicyManagementService);
    });

    it("should persist a row for every policy definition using the configured defaults", async () => {
      envService.get.mockReturnValue(7);
      limitRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      limitRepository.update.mockImplementation(async (l: Limit) => l);
      quotaRepository.update.mockImplementation(async (q: Quota) => q);

      await service.ensureDefaultPolicies("org-1");

      const savedLimits: Limit[] = limitRepository.update.mock.calls.map(
        (call: [Limit]) => call[0],
      );
      const savedQuotas: Quota[] = quotaRepository.update.mock.calls.map(
        (call: [Quota]) => call[0],
      );

      const rules = Object.values(PolicyDefinitions);
      expect(savedLimits.map((limit) => limit.getKey()).sort()).toEqual(
        rules
          .filter((rule) => rule.type === "limit")
          .map((rule) => rule.key)
          .sort(),
      );
      expect(savedQuotas.map((quota) => quota.getKey()).sort()).toEqual(
        rules
          .filter((rule) => rule.type === "quota")
          .map((rule) => rule.key)
          .sort(),
      );

      for (const policy of [...savedLimits, ...savedQuotas]) {
        expect(policy.getOrganizationId()).toBe("org-1");
        expect(policy.getLimit()).toBe(7);
      }
      expect(savedQuotas[0].getPeriod()).toBe("month");
      expect(savedQuotas[0].getCount()).toBe(0);
    });
  });

  describe("setLimits", () => {
    let service: PolicyManagementService;
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
        findOneByOrganizationIdAndKey: jest.fn(async (_orgId: string, key: PolicyKey) =>
          storedLimits.get(key),
        ),
        findOneByOrganizationIdAndKeyOrFail: jest.fn(async (_orgId: string, key: PolicyKey) =>
          findOrFail(storedLimits, key),
        ),
        update: jest.fn(async (limit: Limit) => {
          storedLimits.set(limit.getKey(), limit);
          return limit;
        }),
      };
      const quotaRepository = {
        findOneByOrganizationIdAndKey: jest.fn(async (_orgId: string, key: PolicyKey) =>
          storedQuotas.get(key),
        ),
        findOneByOrganizationIdAndKeyOrFail: jest.fn(async (_orgId: string, key: PolicyKey) =>
          findOrFail(storedQuotas, key),
        ),
        update: jest.fn(async (quota: Quota) => {
          storedQuotas.set(quota.getKey(), quota);
          return quota;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyManagementService,
          PolicyService,
          { provide: LimitRepository, useValue: limitRepository },
          { provide: QuotaRepository, useValue: quotaRepository },
          { provide: EnvService, useValue: { get: jest.fn(() => 0) } },
          { provide: LimitEvaluatorService, useValue: { getCurrent: jest.fn(async () => 5) } },
        ],
      }).compile();

      service = module.get<PolicyManagementService>(PolicyManagementService);
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
});
