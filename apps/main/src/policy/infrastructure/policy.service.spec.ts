import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Quota } from "../domain/quota";
import { LimitEvaluatorService } from "./limit-evaluator.service";
import { LimitRepository } from "./limit.repository";
import { PolicyService } from "./policy.service";
import { QuotaRepository } from "./quota.repository";
import { PolicyKeyList } from "@open-dpp/dto";

describe("policyService", () => {
  let service: PolicyService;
  let limitRepository: any;
  let quotaRepository: any;
  let envService: any;
  let limitEvaluatorService: any;

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

  describe("getQuota", () => {
    it("should reset and persist a quota whose period has elapsed", async () => {
      const stale = Quota.loadFromDb({
        organizationId: "org-1",
        key: PolicyKeyList.AI_TOKEN_QUOTA,
        limit: 100,
        period: "month",
        count: 55,
        lastSetBack: new Date("2020-01-01T00:00:00.000Z"),
      });
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(stale);
      quotaRepository.update.mockImplementation(async (q: Quota) => q);

      const quota = await service.getQuota("org-1", PolicyKeyList.AI_TOKEN_QUOTA);

      expect(quota?.getCount()).toBe(0);
      expect(quotaRepository.update).toHaveBeenCalledTimes(1);
    });

    it("should return undefined when no quota is stored", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);

      await expect(
        service.getQuota("org-1", PolicyKeyList.AI_TOKEN_QUOTA),
      ).resolves.toBeUndefined();
    });
  });

  describe("isQuotaExceeded", () => {
    it("should throw an error when called with a LIMIT key", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      envService.get.mockReturnValue(100);

      await expect(
        service.isQuotaExceeded("org-1", PolicyKeyList.PASSPORT_CREATE_LIMIT),
      ).rejects.toThrow("Policy PASSPORT_CREATE_LIMIT is not a quota rule");
    });
  });

  describe("incrementQuota", () => {
    it("should increment an existing quota and persist it", async () => {
      const existing = Quota.create({
        organizationId: "org-1",
        key: PolicyKeyList.AI_TOKEN_QUOTA,
        limit: 100,
        period: "month",
      });
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(existing);
      quotaRepository.update.mockImplementation(async (q: Quota) => q);

      const quota = await service.incrementQuota("org-1", PolicyKeyList.AI_TOKEN_QUOTA, 5);

      expect(quota.getCount()).toBe(5);
      expect(quotaRepository.update).toHaveBeenCalledWith(existing);
    });

    it("should create a quota from the rule default when none is stored", async () => {
      quotaRepository.findOneByOrganizationIdAndKey.mockResolvedValue(undefined);
      envService.get.mockReturnValue(100);
      quotaRepository.update.mockImplementation(async (q: Quota) => q);

      const quota = await service.incrementQuota("org-1", PolicyKeyList.AI_TOKEN_QUOTA, 2);

      expect(quota.getCount()).toBe(2);
      expect(quota.getLimit()).toBe(100);
      expect(quota.getPeriod()).toBe("month");
    });
  });
});
