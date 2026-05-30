import { describe, expect, it } from "@jest/globals";
import { Gs1ResolverBaseUrlSetting } from "./gs1-resolver-base-url-setting";

describe("Gs1ResolverBaseUrlSetting", () => {
  it("exposes the env name and setting name", () => {
    expect(Gs1ResolverBaseUrlSetting.ENV_NAME).toBe("OPEN_DPP_GS1_RESOLVER_BASE_URL");
    expect(Gs1ResolverBaseUrlSetting.NAME).toBe("gs1ResolverBaseUrl");
  });

  it("defaults to a null value when created without data", () => {
    const setting = Gs1ResolverBaseUrlSetting.create();
    expect(setting.value).toBeNull();
    expect(setting.locked).toBeUndefined();
    expect(setting.name).toBe("gs1ResolverBaseUrl");
    expect(setting.envName).toBe("OPEN_DPP_GS1_RESOLVER_BASE_URL");
  });

  it("carries a provided value", () => {
    const setting = Gs1ResolverBaseUrlSetting.create({ value: "https://id.acme.com" });
    expect(setting.value).toBe("https://id.acme.com");
  });
});
