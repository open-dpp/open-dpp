import { z } from 'zod'

export const ValueResponseDtoSchema = z.json()

export type ValueResponseDto = z.infer<typeof ValueResponseDtoSchema>
