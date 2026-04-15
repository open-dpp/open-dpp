import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { InstanceSettings } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import { InstanceSettingsService } from "./instance-settings.service";

describe("InstanceSettingsService", () => {
  let service: InstanceSettingsService;
  let mockRepository: any;
  let mockEnvService: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn<() => Promise<InstanceSettings | null>>(),
      save: jest
        .fn<(s: InstanceSettings) => Promise<InstanceSettings>>()
        .mockImplementation(async (s: InstanceSettings) => s),
    };

    mockEnvService = {
      get: jest.fn<(key: string) => any>().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstanceSettingsService,
        { provide: InstanceSettingsRepository, useValue: mockRepository },
        { provide: EnvService, useValue: mockEnvService },
      ],
    }).compile();

    service = module.get<InstanceSettingsService>(InstanceSettingsService);
  });

  describe("getSettings — no env vars set", () => {
    it("should return existing DB settings with empty lockedFields", async () => {
      const existing = InstanceSettings.create({ signupEnabled: { value: false } });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBeUndefined();
    });

    it("should create default settings when no DB record exists", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(true);
      expect(result.signupEnabled.locked).toBeUndefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("getSettings — enforced env var set", () => {
    it("should override DB value with enforced env var", async () => {
      const existing = InstanceSettings.create({ signupEnabled: { value: true } });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBe(true);
    });

    it("should mark signupEnabled as locked", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return true;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.locked).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("should update settings when field is not locked", async () => {
      const existing = InstanceSettings.create({ signupEnabled: { value: true } });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.updateSettings({ signupEnabled: false });

      expect(result.signupEnabled.value).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should reject updates to locked fields with ValueError", async () => {
      const existing = InstanceSettings.create({ signupEnabled: { value: true } });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return false;
        return undefined;
      });

      await expect(service.updateSettings({ signupEnabled: true })).rejects.toThrow(ValueError);
    });

    it("should include descriptive error message for locked fields", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return false;
        return undefined;
      });

      await expect(service.updateSettings({ signupEnabled: true })).rejects.toThrow(
        "Cannot override signupEnabled when OPEN_DPP_INSTANCE_SIGNUP_ENABLED is set",
      );
    });
  });

  describe("hierarchy precedence", () => {
    it("enforced env > DB > hardcoded", async () => {
      // Enforced = false, DB = true → result should be false
      const existing = InstanceSettings.create({ signupEnabled: { value: true } });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBe(true);
    });

    it("hardcoded default when nothing else is set", async () => {
      // No DB, no env → result should be true (hardcoded)
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED") return undefined;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(true);
    });
  });
});
