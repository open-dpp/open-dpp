import { z } from "zod";

export const GetAasConnectionCollectionSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
  })
  .array();
