import type { Gs1DataAttributes } from "@open-dpp/dto";
import { Factory } from "fishery";

interface Gs1DataAttributesTransient {
  entries?: Record<string, string>;
}

/** Factory for a valid GS1 data-attributes map; transient `entries` overrides the whole map. */
export const gs1DataAttributesPlainFactory = Factory.define<
  Gs1DataAttributes,
  Gs1DataAttributesTransient
>(({ transientParams }) => {
  if (transientParams.entries !== undefined) {
    return { ...transientParams.entries };
  }
  return { "17": "251231" };
});
