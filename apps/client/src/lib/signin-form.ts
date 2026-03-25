import { z } from "zod";

export const SigninFormSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export type SigninFormValues = z.infer<typeof SigninFormSchema>;
