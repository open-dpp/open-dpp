import { z } from 'zod'

export const EntityType = {
  CoManagedEntity: 'CoManagedEntity',
  SelfManagedEntity: 'SelfManagedEntity',
}

export const EntityTypeEnum = z.enum(EntityType)
export type EntityTypeType = z.infer<typeof EntityTypeEnum>
