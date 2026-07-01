import type { PermalinkDto } from "@open-dpp/dto";
import { Factory } from "fishery";
import { buildPermalinkCore, type PermalinkBaseTransient } from "./permalink-base";

/** Fishery factory for a plain PermalinkDto — presentation by default, gs1-link via the `gs1` transient. */
export const permalinksPlainFactory = Factory.define<PermalinkDto, PermalinkBaseTransient>(
  ({ params, transientParams }) => buildPermalinkCore(params, transientParams),
);
