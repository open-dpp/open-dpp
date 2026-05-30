import { describe, expect, it } from "@jest/globals";
import { InstanceSettings } from "./instance-settings";

describe("InstanceSettings", () => {
  describe("create", () => {
    it("should create with defaults", () => {
      const settings = InstanceSettings.create();
      expect(settings.signupEnabled.value).toBe(true);

      expect(settings.signupEnabled.locked).toBeUndefined();

      expect(settings.organizationCreationEnabled.value).toBe(true);
      expect(settings.organizationCreationEnabled.locked).toBeUndefined();
      expect(settings.id).toBeDefined();
    });

    it("should create with custom false", () => {
      const settings = InstanceSettings.create({
        signupEnabled: { value: false },
        organizationCreationEnabled: { value: false },
      });
      expect(settings.signupEnabled.value).toBeFalsy();
      expect(settings.organizationCreationEnabled.value).toBeFalsy();
    });

    it("should use default when signupEnabled is undefined", () => {
      const settings = InstanceSettings.create({
        signupEnabled: undefined,
        organizationCreationEnabled: undefined,
      });
      expect(settings.signupEnabled.value).toBeTruthy();
      expect(settings.organizationCreationEnabled.value).toBeTruthy();
    });

    it("should expose permalinkBaseUrl defaulting to null", () => {
      const settings = InstanceSettings.create();
      expect(settings.permalinkBaseUrl.value).toBeNull();
      expect(settings.permalinkBaseUrl.locked).toBeUndefined();
    });

    it("should expose gs1ResolverBaseUrl defaulting to null", () => {
      const settings = InstanceSettings.create();
      expect(settings.gs1ResolverBaseUrl.value).toBeNull();
      expect(settings.gs1ResolverBaseUrl.locked).toBeUndefined();
    });
  });

  describe("loadFromDb", () => {
    it("should restore from DB props", () => {
      const settings = InstanceSettings.loadFromDb({
        id: "abc",
        signupEnabled: false,
        organizationCreationEnabled: false,
        permalinkBaseUrl: null,
        gs1ResolverBaseUrl: null,
      });
      expect(settings.id).toBe("abc");
      expect(settings.signupEnabled.value).toBeFalsy();
      expect(settings.organizationCreationEnabled.value).toBeFalsy();
      expect(settings.permalinkBaseUrl.value).toBeNull();
      expect(settings.gs1ResolverBaseUrl.value).toBeNull();
    });

    it("should restore a persisted gs1ResolverBaseUrl", () => {
      const settings = InstanceSettings.loadFromDb({
        id: "abc",
        signupEnabled: true,
        organizationCreationEnabled: true,
        permalinkBaseUrl: null,
        gs1ResolverBaseUrl: "https://id.acme.com",
      });
      expect(settings.gs1ResolverBaseUrl.value).toBe("https://id.acme.com");
    });
  });

  describe("withEnvOverrides", () => {
    it("should apply enforced signupEnabled value", () => {
      const original = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
        organizationCreationEnabled: false,
      });

      expect(overridden.signupEnabled.value).toBeFalsy();
      expect(overridden.signupEnabled.locked).toBeTruthy();

      expect(overridden.organizationCreationEnabled.value).toBeFalsy();
      expect(overridden.organizationCreationEnabled.locked).toBeTruthy();
    });

    it("should preserve signupEnabled when override is undefined", () => {
      const original = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      const overridden = original.withEnvOverrides({
        signupEnabled: undefined,
        organizationCreationEnabled: undefined,
      });

      expect(overridden.signupEnabled.value).toBe(true);
      expect(overridden.signupEnabled.locked).toBeUndefined();
      expect(overridden.organizationCreationEnabled.value).toBe(true);
      expect(overridden.organizationCreationEnabled.locked).toBeUndefined();
    });

    it("should not mutate the original instance", () => {
      const original = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      original.withEnvOverrides({
        signupEnabled: false,
        organizationCreationEnabled: false,
      });

      expect(original.signupEnabled.value).toBe(true);
      expect(original.signupEnabled.locked).toBeUndefined();
      expect(original.organizationCreationEnabled.value).toBe(true);
      expect(original.organizationCreationEnabled.locked).toBeUndefined();
    });

    it("should preserve the id", () => {
      const original = InstanceSettings.create();
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
        organizationCreationEnabled: false,
      });

      expect(overridden.id).toBe(original.id);
    });

    it("should apply env override on permalinkBaseUrl and lock the setting", () => {
      const original = InstanceSettings.create();
      const overridden = original.withEnvOverrides({
        permalinkBaseUrl: "https://env.example.com/p",
      });

      expect(overridden.permalinkBaseUrl.value).toBe("https://env.example.com/p");
      expect(overridden.permalinkBaseUrl.locked).toBe(true);
    });

    it("should reject update when permalinkBaseUrl is locked", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        permalinkBaseUrl: "https://env.example.com/p",
      });

      expect(() => settings.update({ permalinkBaseUrl: "https://other.example.com/p" })).toThrow(
        "Cannot override permalinkBaseUrl when OPEN_DPP_PERMALINK_BASE_URL is set",
      );
    });

    it("should apply env override on gs1ResolverBaseUrl and lock the setting", () => {
      const original = InstanceSettings.create();
      const overridden = original.withEnvOverrides({
        gs1ResolverBaseUrl: "https://id.env.example.com",
      });

      expect(overridden.gs1ResolverBaseUrl.value).toBe("https://id.env.example.com");
      expect(overridden.gs1ResolverBaseUrl.locked).toBe(true);
    });

    it("should reject update when gs1ResolverBaseUrl is locked", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        gs1ResolverBaseUrl: "https://id.env.example.com",
      });

      expect(() => settings.update({ gs1ResolverBaseUrl: "https://id.other.example.com" })).toThrow(
        "Cannot override gs1ResolverBaseUrl when OPEN_DPP_GS1_RESOLVER_BASE_URL is set",
      );
    });
  });

  describe("update", () => {
    it("should return a new instance with updated value", () => {
      const original = InstanceSettings.create({
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
      });
      const updated = original.update({
        signupEnabled: false,
        organizationCreationEnabled: false,
      });

      expect(updated.signupEnabled.value).toBe(false);
      expect(original.signupEnabled.value).toBe(true);
      expect(updated.organizationCreationEnabled.value).toBe(false);
      expect(original.organizationCreationEnabled.value).toBe(true);
    });

    it("should keep current value when update prop is undefined", () => {
      const original = InstanceSettings.create({
        signupEnabled: { value: false },
        organizationCreationEnabled: { value: false },
      });
      const updated = original.update({});

      expect(updated.signupEnabled.value).toBeFalsy();
      expect(updated.organizationCreationEnabled.value).toBeFalsy();
    });

    it("should update permalinkBaseUrl from null to a string", () => {
      const original = InstanceSettings.create();
      const updated = original.update({ permalinkBaseUrl: "https://acme.com/p" });

      expect(updated.permalinkBaseUrl.value).toBe("https://acme.com/p");
      expect(original.permalinkBaseUrl.value).toBeNull();
    });

    it("should clear permalinkBaseUrl when null is passed explicitly", () => {
      const original = InstanceSettings.create({
        permalinkBaseUrl: { value: "https://acme.com/p" },
      });
      const updated = original.update({ permalinkBaseUrl: null });

      expect(updated.permalinkBaseUrl.value).toBeNull();
    });

    it("should update gs1ResolverBaseUrl from null to a string", () => {
      const original = InstanceSettings.create();
      const updated = original.update({ gs1ResolverBaseUrl: "https://id.acme.com" });

      expect(updated.gs1ResolverBaseUrl.value).toBe("https://id.acme.com");
      expect(original.gs1ResolverBaseUrl.value).toBeNull();
    });

    it("should clear gs1ResolverBaseUrl when null is passed explicitly", () => {
      const original = InstanceSettings.create({
        gs1ResolverBaseUrl: { value: "https://id.acme.com" },
      });
      const updated = original.update({ gs1ResolverBaseUrl: null });

      expect(updated.gs1ResolverBaseUrl.value).toBeNull();
    });
  });

  describe("toPlain", () => {
    it("should exclude lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        signupEnabled: true,
        organizationCreationEnabled: true,
      });
      const plain = settings.toPlain();

      expect(plain).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled.value,
        organizationCreationEnabled: settings.organizationCreationEnabled.value,
        permalinkBaseUrl: settings.permalinkBaseUrl.value,
        gs1ResolverBaseUrl: settings.gs1ResolverBaseUrl.value,
      });
    });
  });

  describe("toResponse", () => {
    it("should include lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        signupEnabled: true,
        organizationCreationEnabled: true,
      });
      const response = settings.toResponse();

      expect(response).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled.toResponse(),
        organizationCreationEnabled: settings.organizationCreationEnabled.toResponse(),
        permalinkBaseUrl: settings.permalinkBaseUrl.toResponse(),
        gs1ResolverBaseUrl: settings.gs1ResolverBaseUrl.toResponse(),
      });
    });
  });
});
