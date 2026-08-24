import type { PermalinkDto } from "@open-dpp/dto";
import { Factory } from "fishery";
import { buildPermalinkCore, type PermalinkBaseTransient } from "./permalink-base";

export const permalinksPlainFactory = Factory.define<PermalinkDto, PermalinkBaseTransient>(
  ({ params, transientParams }) => buildPermalinkCore(params, transientParams),
);
