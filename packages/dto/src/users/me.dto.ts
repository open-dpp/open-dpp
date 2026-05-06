import { z } from "zod";
import { PendingEmailChangeDtoSchema } from "./pending-email-change.dto";
import { UserDtoSchema } from "./user.dto";

export const MeDtoSchema = z.object({
  user: UserDtoSchema,
  pendingEmailChange: PendingEmailChangeDtoSchema.nullable(),
});

export type MeDto = z.infer<typeof MeDtoSchema>;
