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
  });

  describe("loadFromDb", () => {
    it("should restore from DB props", () => {
      const settings = InstanceSettings.loadFromDb({
        id: "abc",
        signupEnabled: false,
        organizationCreationEnabled: false,
      });
      expect(settings.id).toBe("abc");
      expect(settings.signupEnabled.value).toBeFalsy();
      expect(settings.organizationCreationEnabled.value).toBeFalsy();
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
      });
    });
  });
});
