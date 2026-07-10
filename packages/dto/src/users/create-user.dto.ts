import { z } from "zod";

export const CreateUserDtoSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
