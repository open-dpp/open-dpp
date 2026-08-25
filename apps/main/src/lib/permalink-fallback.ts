import { canonicaliseBaseUrl } from "@open-dpp/dto";

/**
 * Backward-compat fallback for the permalink base URL.
 *
 * When no permalink base URL is configured (per-permalink, branding, or instance setting),
 * the system defaults to the canonicalised `OPEN_DPP_URL` with `"/p"` appended.
 * This preserves the URL shape of pre-refactor deployments where `"/p/"` was
 * hardcoded into the calculator.
 *
 * @param instanceRootUrl - the value of `OPEN_DPP_URL`
 * @returns the canonical URL where permalinks live by default
 */
export function computePermalinkBaseUrlFallback(instanceRootUrl: string): string {
  return `${canonicaliseBaseUrl(instanceRootUrl)}/p`;
}
