import { z } from "zod";

export const SignupFormSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().min(1).email(),
    password: z.string().min(8).max(128),
    // the password field is masked, so a typo would otherwise only be noticed at the next sign in
    passwordRepeat: z.string(),
  })
  .refine((values) => values.password === values.passwordRepeat, {
    path: ["passwordRepeat"],
    params: { i18n: "validation.passwordMismatch" },
  });

export type SignupFormValues = z.infer<typeof SignupFormSchema>;
