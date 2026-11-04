import { z } from "zod";

export const ResendVerificationEmailDtoSchema = z.object({
  // Where the link of the verification mail leads to once the address is verified: a path of this
  // application, e.g. the page the user came from. Anything else, like another site or a
  // protocol-relative URL, is rejected.
  callbackPath: z
    .string()
    .max(2048)
    .regex(/^\/(?![/\\])/)
    // eslint-disable-next-line no-control-regex
    .refine((path) => !/[\u0000-\u001F\u007F]/.test(path))
    .optional(),
});

export type ResendVerificationEmailDto = z.infer<typeof ResendVerificationEmailDtoSchema>;
