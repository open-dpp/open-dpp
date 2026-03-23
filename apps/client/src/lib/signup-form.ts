import { z } from "zod";

export const SignupFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().min(1).email(),
  password: z.string().min(8).max(128),
});

export type SignupFormValues = z.infer<typeof SignupFormSchema>;
