import { Factory } from "fishery";
import { RAW_GTIN13 } from "./gtin.fixtures";

interface UpdateRequestTransient {
  /** GS1 batch (AI 10) to include in the request */
  batch?: string;
  /** GS1 serial (AI 21) to include in the request */
  serial?: string;
}

/**
 * The raw (pre-parse) shape of an update request before Zod transforms it.
 * gtin is a raw GTIN-13 string (not yet normalized to GTIN-14).
 * No referenceId — the passport reference is immutable and cannot be changed.
 */
interface UpdateRequestRaw {
  gtin: string;
  batch?: string;
  serial?: string;
}

/** Fishery factory for a raw UpdateGs1UniqueProductIdentifierRequest (no referenceId; un-normalized GTIN-13). */
export const uniqueProductIdentifierUpdateRequestPlainFactory = Factory.define<
  UpdateRequestRaw,
  UpdateRequestTransient
>(({ transientParams }) => ({
  gtin: RAW_GTIN13,
  ...(transientParams.batch !== undefined && { batch: transientParams.batch }),
  ...(transientParams.serial !== undefined && { serial: transientParams.serial }),
}));
