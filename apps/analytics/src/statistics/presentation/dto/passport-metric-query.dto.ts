import { z } from 'zod/v4';
import { MeasurementType } from '../../domain/passport-metric';
import { TimePeriod } from '../../infrastructure/passport-metric.service';

export const PassportMetricQuerySchema = z.object({
  startDate: z.iso.datetime().transform((v) => new Date(v)),
  endDate: z.iso.datetime().transform((v) => new Date(v)),
  templateId: z.uuid(),
  modelId: z.uuid(),
  type: z.enum(MeasurementType),
  valueKey: z.string(),
  period: z.enum(TimePeriod),
});

export type PassportMetricQueryDto = z.infer<typeof PassportMetricQuerySchema>;
