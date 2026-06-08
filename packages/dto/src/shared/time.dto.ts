import { z } from "zod";

export const PeriodDtoSchema = z.object({
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export type PeriodDto = z.infer<typeof PeriodDtoSchema>;
