import { jest } from "@jest/globals";
import { canonicaliseBaseUrl } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { Branding } from "../../../branding/domain/branding";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { computePermalinkBaseUrlFallback } from "../../../lib/permalink-fallback";
import { BaseUrlResolver, resolveFallbackBaseUrl } from "./base-url-resolver.service";

const INSTANCE_ROOT = "https://instance.example.com";
const BRANDING_BASE = "https://brand.example.com";
const ORG_ID = "org-1";

const brandingWithBase = (permalinkBaseUrl: string | null): Branding =>
  ({ permalinkBaseUrl }) as unknown as Branding;

describe("BaseUrlResolver", () => {
  const findOneByOrganizationIdOrNull = jest.fn();
  const getSettings = jest.fn();
  const get = jest.fn();

  const setInstanceSetting = (value: string | null) =>
    getSettings.mockResolvedValue({ permalinkBaseUrl: { value } } as never);

  const makeResolver = () =>
    new BaseUrlResolver(
      { findOneByOrganizationIdOrNull } as unknown as BrandingRepository,
      { get } as unknown as EnvService,
      { getSettings } as unknown as InstanceSettingsService,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    get.mockReturnValue(INSTANCE_ROOT);
    setInstanceSetting(null);
    findOneByOrganizationIdOrNull.mockResolvedValue(null as never);
  });

  describe("getInstanceBaseUrl", () => {
    it("returns the permalinkBaseUrl instance setting verbatim when set", async () => {
      setInstanceSetting("https://configured.example.com/p");
      await expect(makeResolver().getInstanceBaseUrl()).resolves.toBe(
        "https://configured.example.com/p",
      );
      expect(get).not.toHaveBeenCalled();
    });

    it("falls back to the canonicalised OPEN_DPP_URL (+/p) when the setting is null", async () => {
      await expect(makeResolver().getInstanceBaseUrl()).resolves.toBe(
        computePermalinkBaseUrlFallback(INSTANCE_ROOT),
      );
      expect(get).toHaveBeenCalledWith("OPEN_DPP_URL");
    });
  });

  describe("resolveFallbackBase", () => {
    it("uses the org branding permalinkBaseUrl (source=branding) when present", async () => {
      findOneByOrganizationIdOrNull.mockResolvedValue(brandingWithBase(BRANDING_BASE) as never);
      await expect(makeResolver().resolveFallbackBase(ORG_ID)).resolves.toEqual({
        url: BRANDING_BASE,
        source: "branding",
      });
      expect(findOneByOrganizationIdOrNull).toHaveBeenCalledWith(ORG_ID);
    });

    it("falls back to the instance base (source=instance) when branding is null", async () => {
      await expect(makeResolver().resolveFallbackBase(ORG_ID)).resolves.toEqual({
        url: computePermalinkBaseUrlFallback(INSTANCE_ROOT),
        source: "instance",
      });
    });

    it("skips the branding load and returns the instance base when no organizationId is given", async () => {
      await expect(makeResolver().resolveFallbackBase()).resolves.toEqual({
        url: computePermalinkBaseUrlFallback(INSTANCE_ROOT),
        source: "instance",
      });
      expect(findOneByOrganizationIdOrNull).not.toHaveBeenCalled();
    });
  });

  describe("getResolverBase", () => {
    it("returns the branding override url", async () => {
      findOneByOrganizationIdOrNull.mockResolvedValue(brandingWithBase(BRANDING_BASE) as never);
      await expect(makeResolver().getResolverBase(ORG_ID)).resolves.toBe(BRANDING_BASE);
    });

    it("returns the instance base url when the org has no branding override", async () => {
      await expect(makeResolver().getResolverBase(ORG_ID)).resolves.toBe(
        computePermalinkBaseUrlFallback(INSTANCE_ROOT),
      );
    });
  });

  describe("resolveFallbackBaseUrl (pure)", () => {
    it("prefers branding.permalinkBaseUrl verbatim", () => {
      expect(resolveFallbackBaseUrl(brandingWithBase(BRANDING_BASE), `${INSTANCE_ROOT}/p`)).toEqual({
        url: BRANDING_BASE,
        source: "branding",
      });
    });

    it("canonicalises the fallback env url when branding is null or has no base", () => {
      const expected = { url: canonicaliseBaseUrl(INSTANCE_ROOT), source: "instance" };
      expect(resolveFallbackBaseUrl(null, INSTANCE_ROOT)).toEqual(expected);
      expect(resolveFallbackBaseUrl(brandingWithBase(null), INSTANCE_ROOT)).toEqual(expected);
    });
  });
});
