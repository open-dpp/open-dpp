import { z } from "zod";

export const CreateUserDtoSchema = z.object({
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
