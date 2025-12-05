import { z } from "zod";

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
