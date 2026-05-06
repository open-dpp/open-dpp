import { z } from "zod";

export const CreateUserDtoSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
