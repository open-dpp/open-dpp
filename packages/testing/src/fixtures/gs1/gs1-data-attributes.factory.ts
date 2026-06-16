import type { Gs1DataAttributes } from "@open-dpp/dto";
import { Factory } from "fishery";

interface Gs1DataAttributesTransient {
  entries?: Record<string, string>;
}

/**
 * Fishery factory for a valid GS1 data-attributes map.
 *
 * Default output: { "17": "251231" } — a minimal valid map containing only
 * a non-key (data-attribute) AI. Key AIs ("01", "10", "21") are never included.
 *
 * Transient param `entries` overrides the entire map. Pass `{}` for an empty map.
 */
export const gs1DataAttributesPlainFactory = Factory.define<
  Gs1DataAttributes,
  Gs1DataAttributesTransient
>(({ transientParams }) => {
  if (transientParams.entries !== undefined) {
    return { ...transientParams.entries };
  }
  return { "17": "251231" };
});
