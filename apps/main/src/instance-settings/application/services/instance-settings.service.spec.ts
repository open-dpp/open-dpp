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
      save: jest.fn<(s: InstanceSettings) => Promise<InstanceSettings>>()
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
      const existing = InstanceSettings.create({ signupEnabled: false });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(false);
      expect(result.lockedFields).toEqual([]);
    });

    it("should create default settings when no DB record exists", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(true);
      expect(result.lockedFields).toEqual([]);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("getSettings — default env var set", () => {
    it("should use env default for initial creation when no DB record exists", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_DEFAULT_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(false);
      expect(result.lockedFields).toEqual([]);
    });

    it("should NOT override existing DB value with env default", async () => {
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_DEFAULT_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(true);
    });
  });

  describe("getSettings — enforced env var set", () => {
    it("should override DB value with enforced env var", async () => {
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(false);
      expect(result.lockedFields).toEqual(["signupEnabled"]);
    });

    it("should mark signupEnabled as locked", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED")
          return true;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.lockedFields).toContain("signupEnabled");
    });
  });

  describe("updateSettings", () => {
    it("should update settings when field is not locked", async () => {
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.updateSettings({ signupEnabled: false });

      expect(result.signupEnabled).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should reject updates to locked fields with ValueError", async () => {
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      await expect(
        service.updateSettings({ signupEnabled: true }),
      ).rejects.toThrow(ValueError);
    });

    it("should include descriptive error message for locked fields", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      await expect(
        service.updateSettings({ signupEnabled: true }),
      ).rejects.toThrow("Cannot update settings locked by environment variables: signupEnabled");
    });
  });

  describe("hierarchy precedence", () => {
    it("enforced env > DB > default env > hardcoded", async () => {
      // Enforced = false, DB = true → result should be false
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_SIGNUP_ENABLED")
          return false;
        if (key === "OPEN_DPP_INSTANCE_DEFAULT_SIGNUP_ENABLED")
          return true;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(false);
      expect(result.lockedFields).toContain("signupEnabled");
    });

    it("DB > default env when DB exists", async () => {
      // DB = true, Default env = false → result should be true (DB wins)
      const existing = InstanceSettings.create({ signupEnabled: true });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_DEFAULT_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(true);
    });

    it("default env > hardcoded when no DB record", async () => {
      // No DB, Default env = false, Hardcoded = true → result should be false
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === "OPEN_DPP_INSTANCE_DEFAULT_SIGNUP_ENABLED")
          return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(false);
    });

    it("hardcoded default when nothing else is set", async () => {
      // No DB, no env → result should be true (hardcoded)
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result.signupEnabled).toBe(true);
    });
  });
});
