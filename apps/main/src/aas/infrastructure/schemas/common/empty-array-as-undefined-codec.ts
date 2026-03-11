import { z } from "zod/v4";

export function emptyArrayAsUndefinedCodec<T>(itemSchema: z.ZodType<T, T>) {
  const arraySchema = z.array(itemSchema);

  return z.codec(
    arraySchema,
    arraySchema.nullish(),
    {
      decode: items => items.length > 0 ? items : undefined,
      encode: items => items && items.length > 0 ? arraySchema.parse(items) : [],
    },
  );
}
