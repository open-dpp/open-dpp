import { expect, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { PolicyKey } from "../domain/policy";
import { CapEvaluatorService } from "./cap-evaluator.service";
import { CapDoc } from "./cap.schema";
import { PolicyService } from "./policy.service";
import { QuotaDoc } from "./quota.schema";

describe("policyService", () => {
  let service: PolicyService;
  let quotaModel: any;
  let capModel: any;
  let envService: any;
  let capEvaluatorService: any;

  beforeEach(async () => {
    quotaModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    capModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    envService = {
      get: jest.fn(),
    };
    capEvaluatorService = {
      getCurrent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getModelToken(CapDoc.name),
          useValue: capModel,
        },
        {
          provide: getModelToken(QuotaDoc.name),
          useValue: quotaModel,
        },
        {
          provide: EnvService,
          useValue: envService,
        },
        {
          provide: CapEvaluatorService,
          useValue: capEvaluatorService,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isQuotaExceeded", () => {
    it("should throw an error when called with a CAP key", async () => {
      // Setup: Quota not found in DB, so it tries to create one
      quotaModel.findOne.mockReturnValue({
        exec: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      });

      // Mock environment service to return a default limit
      envService.get.mockReturnValue(100);

      const capKey = PolicyKey.MODEL_CREATE_CAP; // This is a CAP, not a QUOTA

      // Expectation: currently it might fail with undefined period or some other error,
      // but after fix it should throw a clear error.
      // For reproduction, we check what happens now.
      // Since 'period' is undefined, Quota.create will have undefined period.
      await expect(service.isQuotaExceeded("org-1", capKey)).rejects.toThrow(
        "Policy MODEL_CREATE_CAP is not a quota rule",
      );
    });
  });
});
