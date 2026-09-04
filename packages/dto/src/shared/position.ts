import { z } from "zod";

export const PositionSchema = z.int().nonnegative();
