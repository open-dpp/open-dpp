import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { InstanceSettings } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import { InstanceSettingsService } from "./instance-settings.service";
import { SignupEnabledSetting } from "../../domain/signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "../../domain/organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "../../domain/permalink-base-url-setting";
import { MailEnabledSetting } from "../../domain/mail-enabled-setting";

const SMTP_HOST = "smtp.example.com";

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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("mailEnabled precedence", () => {
    const envWith = (values: Record<string, unknown>) =>
      mockEnvService.get.mockImplementation((key: string) => values[key]);

    it("is forced off and locked when no SMTP host is configured, even if the env lock says on", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({ [MailEnabledSetting.ENV_NAME]: true });

      const result = await service.getSettings();

      expect(result.mailEnabled.value).toBe(false);
      expect(result.mailEnabled.locked).toBe(true);
    });

    it("is forced off and locked when the SMTP host is an empty string", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({ OPEN_DPP_MAIL_HOST: "" });

      const result = await service.getSettings();

      expect(result.mailEnabled.value).toBe(false);
      expect(result.mailEnabled.locked).toBe(true);
    });

    it("is locked to OPEN_DPP_INSTANCE_MAIL_ENABLED when the host is set", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({ OPEN_DPP_MAIL_HOST: SMTP_HOST, [MailEnabledSetting.ENV_NAME]: false });

      const result = await service.getSettings();

      expect(result.mailEnabled.value).toBe(false);
      expect(result.mailEnabled.locked).toBe(true);
    });

    it("uses the stored value when the host is set and no env lock exists", async () => {
      mockRepository.findOne.mockResolvedValue(
        InstanceSettings.create({ mailEnabled: { value: false } }),
      );
      envWith({ OPEN_DPP_MAIL_HOST: SMTP_HOST });

      const result = await service.getSettings();

      expect(result.mailEnabled.value).toBe(false);
      expect(result.mailEnabled.locked).toBeUndefined();
    });

    it("defaults to on when the host is set and nothing is stored", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      envWith({ OPEN_DPP_MAIL_HOST: SMTP_HOST });

      const result = await service.getSettings();

      expect(result.mailEnabled.value).toBe(true);
      expect(result.mailEnabled.locked).toBeUndefined();
    });

    it("rejects updating a locked mailEnabled", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({});

      await expect(service.updateSettings({ mailEnabled: true })).rejects.toThrow(
        `Cannot override mailEnabled when ${MailEnabledSetting.ENV_NAME} is set`,
      );
    });

    it("can be toggled off by an admin when unlocked", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({ OPEN_DPP_MAIL_HOST: SMTP_HOST });

      const result = await service.updateSettings({ mailEnabled: false });

      expect(result.mailEnabled.value).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("does not persist the env-forced value when another setting is updated", async () => {
      // No SMTP host → mail forced off. Turning signup off must not write that
      // forced `false` into the DB, or mail stays off once SMTP gets configured.
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      envWith({});

      await service.updateSettings({ signupEnabled: false });

      const persisted = mockRepository.save.mock.calls[0][0] as InstanceSettings;
      expect(persisted.mailEnabled.value).toBe(true);
      expect(persisted.signupEnabled.value).toBe(false);
    });
  });

  describe("cache", () => {
    it("serves repeated reads from memory", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());

      await service.getSettings();
      await service.getSettings();

      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it("reloads after the 60 s TTL", async () => {
      jest.useFakeTimers();
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());

      await service.getSettings();
      jest.advanceTimersByTime(59_000);
      await service.getSettings();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(2_000);
      await service.getSettings();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it("reflects an update immediately without another DB read", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      await service.getSettings();

      await service.updateSettings({ signupEnabled: false });
      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSettings — no env vars set", () => {
    it("should return existing DB settings with empty lockedFields", async () => {
      const existing = InstanceSettings.create({
        signupEnabled: { value: false },
        organizationCreationEnabled: { value: false },
      });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBeUndefined();

      expect(result.organizationCreationEnabled.value).toBe(false);
      expect(result.organizationCreationEnabled.locked).toBeUndefined();
    });

    it("should create default settings when no DB record exists", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(true);
      expect(result.signupEnabled.locked).toBeUndefined();

      expect(result.organizationCreationEnabled.value).toBe(true);
      expect(result.organizationCreationEnabled.locked).toBeUndefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("getSettings — enforced env var set", () => {
    it("should override DB value with enforced env var", async () => {
      const existing = InstanceSettings.create({ signupEnabled: { value: true } });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return false;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBe(true);

      expect(result.organizationCreationEnabled.value).toBe(false);
      expect(result.organizationCreationEnabled.locked).toBe(true);
    });

    it("should mark signupEnabled as locked", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return true;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.locked).toBe(true);
      expect(result.organizationCreationEnabled.locked).toBe(true);
    });

    it("should apply OPEN_DPP_PERMALINK_BASE_URL env override and lock the setting", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === PermalinkBaseUrlSetting.ENV_NAME) return "https://env.example.com/p";
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.permalinkBaseUrl.value).toBe("https://env.example.com/p");
      expect(result.permalinkBaseUrl.locked).toBe(true);
    });

    it("should leave permalinkBaseUrl unlocked when env is not set", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      mockEnvService.get.mockReturnValue(undefined);

      const result = await service.getSettings();

      expect(result.permalinkBaseUrl.value).toBeNull();
      expect(result.permalinkBaseUrl.locked).toBeUndefined();
    });
  });

  describe("updateSettings", () => {
    it("should update settings when field is not locked", async () => {
      const existing = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      mockRepository.findOne.mockResolvedValue(existing);

      const result = await service.updateSettings({
        signupEnabled: false,
        organizationCreationEnabled: false,
      });

      expect(result.signupEnabled.value).toBe(false);
      expect(result.organizationCreationEnabled.value).toBe(false);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should reject updates to locked fields with ValueError", async () => {
      const existing = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return false;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return false;
        return undefined;
      });

      await expect(service.updateSettings({ signupEnabled: true })).rejects.toThrow(ValueError);
      await expect(service.updateSettings({ organizationCreationEnabled: true })).rejects.toThrow(
        ValueError,
      );
    });

    it("should include descriptive error message for locked fields", async () => {
      mockRepository.findOne.mockResolvedValue(InstanceSettings.create());
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return false;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return false;
        return undefined;
      });

      await expect(service.updateSettings({ signupEnabled: true })).rejects.toThrow(
        "Cannot override signupEnabled when OPEN_DPP_INSTANCE_SIGNUP_ENABLED is set",
      );
      await expect(service.updateSettings({ organizationCreationEnabled: true })).rejects.toThrow(
        `Cannot override organizationCreationEnabled when ${OrganizationCreationEnabledSetting.ENV_NAME} is set`,
      );
    });
  });

  describe("hierarchy precedence", () => {
    it("enforced env > DB > hardcoded", async () => {
      // Enforced = false, DB = true → result should be false
      const existing = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      mockRepository.findOne.mockResolvedValue(existing);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return false;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return false;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(false);
      expect(result.signupEnabled.locked).toBe(true);
      expect(result.organizationCreationEnabled.value).toBe(false);
      expect(result.organizationCreationEnabled.locked).toBe(true);
    });

    it("hardcoded default when nothing else is set", async () => {
      // No DB, no env → result should be true (hardcoded)
      mockRepository.findOne.mockResolvedValue(null);
      mockEnvService.get.mockImplementation((key: string) => {
        if (key === SignupEnabledSetting.ENV_NAME) return undefined;
        else if (key === OrganizationCreationEnabledSetting.ENV_NAME) return undefined;
        return undefined;
      });

      const result = await service.getSettings();

      expect(result.signupEnabled.value).toBe(true);
      expect(result.organizationCreationEnabled.value).toBe(true);
    });
  });
});
