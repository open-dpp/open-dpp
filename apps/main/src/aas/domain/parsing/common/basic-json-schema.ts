import { z } from "zod";
import { DataTypeDef } from "../../common/data-type-def";

export function nullishToOptional<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform(value => value === null ? undefined : value);
}

export const ValueTypeSchema = z.string().transform(
  (value) => {
    // turn "positiveInteger" → "PositiveInteger"
    let key = value;
    if (value.startsWith("xs:")) {
      const raw = value.replace(/^xs:/, "");
      key = raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    // validate against enum
    if (!(key in DataTypeDef)) {
      throw new Error(`Unknown number type: ${value}`);
    }

    // return the enum value
    return z.enum(DataTypeDef).parse(key);
  },
);
