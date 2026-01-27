import { z } from 'zod'

export const ValueSchema = z.json()

export type ValueRequestDto = z.input<typeof ValueSchema>

export type ValueResponseDto = z.infer<typeof ValueSchema>
