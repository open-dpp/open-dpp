import { z } from "zod";

export const ApiVersions = {
  v1: "1",
  v2: "2",
} as const;
export const ApiVersionsEnum = z.enum(ApiVersions);
export type ApiVersionsType = z.infer<typeof ApiVersionsEnum>;

export const DefaultApiVersion = ApiVersions.v1;
