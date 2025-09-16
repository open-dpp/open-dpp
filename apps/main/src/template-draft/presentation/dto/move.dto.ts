import { z } from 'zod';
import { MoveDirection } from '../../domain/template-draft';

export enum MoveType {
  POSITION = 'Position',
}

export const MoveDtoSchema = z.object({
  type: z.enum(MoveType),
  direction: z.enum(MoveDirection),
});

export type MoveDto = z.infer<typeof MoveDtoSchema>;
