import { Buffer } from "node:buffer";
import { Binary } from "mongodb";
import { z } from "zod";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const BlobDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  contentType: z.string(),
  extensions: ExtensionDbSchema.array().default([]),
  value: z.codec(
    z.base64(),
    z.instanceof(Binary),
    {
      decode: str => new Binary(Buffer.from(str)),
      encode: buffer => buffer.buffer.toString(),
    },
  ).nullish(),
});
