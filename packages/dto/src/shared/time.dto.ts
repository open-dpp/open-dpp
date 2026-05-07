import { z } from "zod";

export const PeriodDtoSchema = z.object({
  start: z.iso.datetime().optional(),
  end: z.iso.datetime().optional(),
});

export type PeriodDto = z.infer<typeof PeriodDtoSchema>;
