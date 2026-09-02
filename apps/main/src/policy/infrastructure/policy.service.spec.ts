import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Limit } from "../domain/limit";
import { PolicyKey } from "../domain/policy-rules";
import { Quota } from "../domain/quota";
import { LimitEvaluatorService } from "./limit-evaluator.service";
import { LimitRepository } from "./limit.repository";
import { PolicyService } from "./policy.service";
import { QuotaRepository } from "./quota.repository";

describe("policyService", () => {
  let service: PolicyService;
  let limitRepository: any;
  let quotaRepository: any;
  let envService: any;
  let limitEvaluatorService: any;

  beforeEach(async () => {
    limitRepository = {
      findOneByOrganizationIdAndKey: jest.fn(),
      save: jest.fn(),
    };
    quotaRepository = {
      findOneByOrganizationIdAndKey: jest.fn(),
      save: jest.fn(),
    };
    envService = {
      get: jest.fn(),
    };
    limitEvaluatorService = {
      getCurrent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: LimitRepository, useValue: limitRepository },
        { provide: QuotaRepository, useValue: quotaRepository },
        { provide: EnvService, useValue: envService },
        { provide: LimitEvaluatorService, useValue: limitEvaluatorService },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLimit", () => {
    it("should return the stored limit when one exists", async () => {
      limitRepository.findOneByOrganizationIdAndKey.mockResolvedValue(
        Limit.create({
          organizationId: "org-1",
          key: PolicyKey.PASSPORT_CREATE_LIMIT,
          limit: 42,
        }),
      );

      const limit = await service.getLimit("org-1", PolicyKey.PASSPORT_CREATE_LIMIT);

      expect(limit.getLimit()).toBe(42);
      expect(limitRepository.findOneByOrganizationIdAndKey).toHaveBeenCalledWith(
        "org-1",
        PolicyKey.PASSPORT_CREATE_LIMIT,
      );
    });

    it("should fall back to the configured default without persisting it", async () => {
      limitRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      envService.get.mockReturnValue(10);

      const limit = await service.getLimit("org-1", PolicyKey.PASSPORT_CREATE_LIMIT);

      expect(limit.getLimit()).toBe(10);
      expect(limit.getOrganizationId()).toBe("org-1");
      expect(limitRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getQuota", () => {
    it("should reset and persist a quota whose period has elapsed", async () => {
      const stale = Quota.loadFromDb({
        organizationId: "org-1",
        key: PolicyKey.AI_TOKEN_QUOTA,
        limit: 100,
        period: "month",
        count: 55,
        lastSetBack: new Date("2020-01-01T00:00:00.000Z"),
      });
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(stale);
      quotaRepository.save.mockImplementation(async (q: Quota) => q);

      const quota = await service.getQuota("org-1", PolicyKey.AI_TOKEN_QUOTA);

      expect(quota?.getCount()).toBe(0);
      expect(quotaRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should return undefined when no quota is stored", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);

      await expect(service.getQuota("org-1", PolicyKey.AI_TOKEN_QUOTA)).resolves.toBeUndefined();
    });
  });

  describe("isQuotaExceeded", () => {
    it("should throw an error when called with a LIMIT key", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      envService.get.mockReturnValue(100);

      await expect(
        service.isQuotaExceeded("org-1", PolicyKey.PASSPORT_CREATE_LIMIT),
      ).rejects.toThrow("Policy PASSPORT_CREATE_LIMIT is not a quota rule");
    });
  });

  describe("ensureDefaultPolicies", () => {
    it("should persist a row for every policy definition using the configured defaults", async () => {
      envService.get.mockReturnValue(7);
      limitRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      limitRepository.save.mockImplementation(async (l: Limit) => l);
      quotaRepository.save.mockImplementation(async (q: Quota) => q);

      await service.ensureDefaultPolicies("org-1");

      const savedLimits: Limit[] = limitRepository.save.mock.calls.map((call: [Limit]) => call[0]);
      const savedQuotas: Quota[] = quotaRepository.save.mock.calls.map((call: [Quota]) => call[0]);

      expect(savedLimits.map((limit) => limit.getKey()).sort()).toEqual(
        [PolicyKey.MEDIA_STORAGE_LIMIT, PolicyKey.PASSPORT_CREATE_LIMIT].sort(),
      );
      expect(savedQuotas.map((quota) => quota.getKey())).toEqual([PolicyKey.AI_TOKEN_QUOTA]);

      for (const policy of [...savedLimits, ...savedQuotas]) {
        expect(policy.getOrganizationId()).toBe("org-1");
        expect(policy.getLimit()).toBe(7);
      }
      expect(savedQuotas[0].getPeriod()).toBe("month");
      expect(savedQuotas[0].getCount()).toBe(0);
    });
  });

  describe("incrementQuota", () => {
    it("should increment an existing quota and persist it", async () => {
      const existing = Quota.create({
        organizationId: "org-1",
        key: PolicyKey.AI_TOKEN_QUOTA,
        limit: 100,
        period: "month",
      });
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(existing);
      quotaRepository.save.mockImplementation(async (q: Quota) => q);

      const quota = await service.incrementQuota("org-1", PolicyKey.AI_TOKEN_QUOTA, 5);

      expect(quota.getCount()).toBe(5);
      expect(quotaRepository.save).toHaveBeenCalledWith(existing);
    });

    it("should create a quota from the rule default when none is stored", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      envService.get.mockReturnValue(100);
      quotaRepository.save.mockImplementation(async (q: Quota) => q);

      const quota = await service.incrementQuota("org-1", PolicyKey.AI_TOKEN_QUOTA, 2);

      expect(quota.getCount()).toBe(2);
      expect(quota.getLimit()).toBe(100);
      expect(quota.getPeriod()).toBe("month");
    });
  });
});
