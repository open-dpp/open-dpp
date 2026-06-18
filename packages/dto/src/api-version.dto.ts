import { z } from "zod";

export const ApiVersionsDto = {
  v1: "1",
  v2: "2",
} as const;
export const ApiVersionsDtoEnum = z.enum(ApiVersionsDto);
export type ApiVersionsDtoType = z.infer<typeof ApiVersionsDtoEnum>;

export const LatestApiVersionDto = ApiVersionsDto.v2;
