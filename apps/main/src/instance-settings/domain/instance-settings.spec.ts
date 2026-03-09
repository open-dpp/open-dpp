import { describe, expect, it } from "@jest/globals";
import { InstanceSettings } from "./instance-settings";

describe("InstanceSettings", () => {
  describe("create", () => {
    it("should create with default signupEnabled=true", () => {
      const settings = InstanceSettings.create();
      expect(settings.signupEnabled).toBe(true);
      expect(settings.lockedFields).toEqual([]);
      expect(settings.id).toBeDefined();
    });

    it("should create with custom signupEnabled=false", () => {
      const settings = InstanceSettings.create({ signupEnabled: false });
      expect(settings.signupEnabled).toBe(false);
    });

    it("should use default when signupEnabled is undefined", () => {
      const settings = InstanceSettings.create({ signupEnabled: undefined });
      expect(settings.signupEnabled).toBe(true);
    });
  });

  describe("loadFromDb", () => {
    it("should restore from DB props", () => {
      const settings = InstanceSettings.loadFromDb({ id: "abc", signupEnabled: false });
      expect(settings.id).toBe("abc");
      expect(settings.signupEnabled).toBe(false);
      expect(settings.lockedFields).toEqual([]);
    });
  });

  describe("withEnvOverrides", () => {
    it("should apply enforced signupEnabled value", () => {
      const original = InstanceSettings.create({ signupEnabled: true });
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
        lockedFields: ["signupEnabled"],
      });

      expect(original.signupEnabled).toBe(true);
      expect(overridden.signupEnabled).toBe(false);
      expect(overridden.lockedFields).toEqual(["signupEnabled"]);
    });

    it("should preserve signupEnabled when override is undefined", () => {
      const original = InstanceSettings.create({ signupEnabled: true });
      const overridden = original.withEnvOverrides({
        signupEnabled: undefined,
        lockedFields: [],
      });

      expect(overridden.signupEnabled).toBe(true);
      expect(overridden.lockedFields).toEqual([]);
    });

    it("should not mutate the original instance", () => {
      const original = InstanceSettings.create({ signupEnabled: true });
      original.withEnvOverrides({
        signupEnabled: false,
        lockedFields: ["signupEnabled"],
      });

      expect(original.signupEnabled).toBe(true);
      expect(original.lockedFields).toEqual([]);
    });

    it("should preserve the id", () => {
      const original = InstanceSettings.create();
      const overridden = original.withEnvOverrides({
        signupEnabled: false,
        lockedFields: ["signupEnabled"],
      });

      expect(overridden.id).toBe(original.id);
    });
  });

  describe("update", () => {
    it("should return a new instance with updated value", () => {
      const original = InstanceSettings.create({ signupEnabled: true });
      const updated = original.update({ signupEnabled: false });

      expect(updated.signupEnabled).toBe(false);
      expect(original.signupEnabled).toBe(true);
    });

    it("should preserve lockedFields through update", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        lockedFields: ["signupEnabled"],
      });
      const updated = settings.update({ signupEnabled: false });

      expect(updated.lockedFields).toEqual(["signupEnabled"]);
    });

    it("should keep current value when update prop is undefined", () => {
      const original = InstanceSettings.create({ signupEnabled: false });
      const updated = original.update({});

      expect(updated.signupEnabled).toBe(false);
    });
  });

  describe("toPlain", () => {
    it("should exclude lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        lockedFields: ["signupEnabled"],
      });
      const plain = settings.toPlain();

      expect(plain).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled,
      });
      expect(plain).not.toHaveProperty("lockedFields");
    });
  });

  describe("toResponse", () => {
    it("should include lockedFields", () => {
      const settings = InstanceSettings.create().withEnvOverrides({
        lockedFields: ["signupEnabled"],
      });
      const response = settings.toResponse();

      expect(response).toEqual({
        id: settings.id,
        signupEnabled: settings.signupEnabled,
        lockedFields: ["signupEnabled"],
      });
    });

    it("should return empty lockedFields when none are locked", () => {
      const settings = InstanceSettings.create();
      const response = settings.toResponse();

      expect(response.lockedFields).toEqual([]);
    });
  });
});
