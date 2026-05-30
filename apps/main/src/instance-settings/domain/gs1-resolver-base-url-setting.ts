import { StringInstanceSetting, StringInstanceSettingCreateProps } from "./string-instance-setting";

/**
 * Instance-level default base URL for assembling GS1 Digital Links.
 *
 * When unset, the GS1 resolver base defaults to the canonicalised instance root
 * (`OPEN_DPP_URL`, bare — NOT the permalink `/p` base). An organization may
 * further override this via its branding. Locked when the `OPEN_DPP_GS1_RESOLVER_BASE_URL`
 * env var is set.
 */
export class Gs1ResolverBaseUrlSetting extends StringInstanceSetting {
  static readonly ENV_NAME = "OPEN_DPP_GS1_RESOLVER_BASE_URL";
  static readonly NAME = "gs1ResolverBaseUrl";

  public static create(data: StringInstanceSettingCreateProps = {}): StringInstanceSetting {
    return new StringInstanceSetting(
      Gs1ResolverBaseUrlSetting.NAME,
      Gs1ResolverBaseUrlSetting.ENV_NAME,
      data.value ?? null,
      data.locked,
    );
  }
}
