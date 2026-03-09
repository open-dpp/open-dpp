import { describe, expect, it } from "@jest/globals";
import { InstanceSettings } from "./instance-settings";

describe("InstanceSettings", () => {
  describe("create", () => {
    it("should create with default signupEnabled=true", () => {
      const settings = InstanceSettings.create();
      expect(settings.signupEnabled.value).toBe(true);
      expect(settings.id).toBeDefined();
    });

    it("should create with custom signupEnabled=false", () => {
      const settings = InstanceSettings.create({ signupEnabled: { value: false } });
      expect(settings.signupEnabled.value).toBe(false);
    });

    it("should use default when signupEnabled is undefined", () => {
      const settings = InstanceSettings.create({ signupEnabled: undefined });
      expect(settings.signupEnabled.value).toBe(true);
    });
  });

  describe("loadFromDb", () => {
    it("should restore from DB props", () => {
      const settings = InstanceSettings.loadFromDb({ id: "abc", signupEnabled: false });
      expect(settings.id).toBe("abc");
      expect(settings.signupEnabled.value).toBe(false);
    });
  });

  describe("withEnvOverrides", () => {
    it("should apply enforced signupEnabled value", () => {
      const original = InstanceSettings.create({ signupEnabled: { value: true } });
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
      });

      expect(original.signupEnabled.value).toBe(true);
      expect(overridden.signupEnabled.locked).toBe(true);
    });

    it("should preserve signupEnabled when override is undefined", () => {
      const original = InstanceSettings.create({ signupEnabled: { value: true } });
      const overridden = original.withEnvOverrides({
        signupEnabled: undefined,
      });

      expect(overridden.signupEnabled.value).toBe(true);
      expect(overridden.signupEnabled.locked).toBeUndefined();
    });

    it("should not mutate the original instance", () => {
      const original = InstanceSettings.create({ signupEnabled: { value: true } });
      original.withEnvOverrides({
        signupEnabled: false,
      });

      expect(original.signupEnabled.value).toBe(true);
      expect(original.signupEnabled.locked).toBeUndefined();
    });

    it("should preserve the id", () => {
      const original = InstanceSettings.create();
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
      });

      expect(overridden.id).toBe(original.id);
    });
  });

  describe("update", () => {
    it("should return a new instance with updated value", () => {
      const original = InstanceSettings.create({ signupEnabled: { value: true } });
      const updated = original.update({ signupEnabled: false });

      expect(updated.signupEnabled.value).toBe(false);
      expect(original.signupEnabled.value).toBe(true);
    });

    it("should keep current value when update prop is undefined", () => {
      const original = InstanceSettings.create({ signupEnabled: { value: false } });
      const updated = original.update({});

      expect(updated.signupEnabled.value).toBe(false);
    });
  });

  describe("toPlain", () => {
    it("should exclude lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        signupEnabled: true,
      });
      const plain = settings.toPlain();

      expect(plain).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled.value,
      });
    });
  });

  describe("toResponse", () => {
    it("should include lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        signupEnabled: true,
      });
      const response = settings.toResponse();

      expect(response).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled,
      });
    });
  });
});
