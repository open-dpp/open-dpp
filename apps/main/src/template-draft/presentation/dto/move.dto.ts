import { z } from "zod";
import { MoveDirection } from "../../domain/template-draft";

export const MoveType = {
  POSITION: "Position",
} as const;

export type MoveType_TYPE = (typeof MoveType)[keyof typeof MoveType];

export const MoveDtoSchema = z.object({
  type: z.enum(MoveType),
  direction: z.enum(MoveDirection),
});

export type MoveDto = z.infer<typeof MoveDtoSchema>;
