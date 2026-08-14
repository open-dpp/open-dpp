import type { PermalinkPublicDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { buildPermalinkCore, type PermalinkBaseTransient } from "./permalink-base";

export const permalinkPublicPlainFactory = Factory.define<
  PermalinkPublicDto,
  PermalinkBaseTransient
>(({ params, transientParams }) => ({
  ...buildPermalinkCore(params, transientParams),
  baseUrl: null,
  publishedUrl: null,
  publicUrl: "https://example.com/p/" + randomUUID(),
  fallbackBaseUrl: "https://example.com",
  fallbackBaseUrlSource: "instance",
}));
