import { z } from 'zod'

export const CreateUserDtoSchema = z.object({
  email: z.email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
