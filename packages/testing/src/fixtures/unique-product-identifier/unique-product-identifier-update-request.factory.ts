import { Factory } from "fishery";
import { RAW_GTIN13 } from "./gtin.fixtures";

interface UpdateRequestTransient {
  batch?: string;
  serial?: string;
}

interface UpdateRequestRaw {
  gtin: string;
  batch?: string;
  serial?: string;
}

export const uniqueProductIdentifierUpdateRequestPlainFactory = Factory.define<
  UpdateRequestRaw,
  UpdateRequestTransient
>(({ transientParams }) => ({
  gtin: RAW_GTIN13,
  ...(transientParams.batch !== undefined && { batch: transientParams.batch }),
  ...(transientParams.serial !== undefined && { serial: transientParams.serial }),
}));
