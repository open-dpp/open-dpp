import { z } from "zod";
import { IdShortPath } from "../aas/domain/submodel-base/submodel";

export const IdDtoSchema = z.string().transform((v) => {
  let parsed = z.uuid().safeParse(v);
  if (parsed.success) {
    return parsed.data;
  }
  parsed = z.base64().safeParse(v);
  if (parsed.success) { // In case of base64 encoded IRI, URL
    return atob(parsed.data);
  }
  return v;
});

export const IdShortPathDtoSchema = z.string().regex(
  /^[a-z0-9]+(?:\.[a-z0-9]+)*$/i,
  "Path must be alphanumeric segments optionally separated by dots",
).transform(v => IdShortPath.create({ path: v }));
