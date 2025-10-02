import type {
  AiConfigurationCreationProps,
  AiConfigurationProps,
} from '../domain/ai-configuration'
import { randomUUID } from 'node:crypto'
import { Factory } from 'fishery'
import {
  AiProvider,
} from '../domain/ai-configuration'

export const nowDate = new Date('2025-01-01T12:00:00Z')

export const aiConfigurationCreationFactory
  = Factory.define<AiConfigurationCreationProps>(() => {
    return {
      createdByUserId: randomUUID(),
      ownedByOrganizationId: randomUUID(),
      provider: AiProvider.Mistral,
      model: 'codestral-latest',
      isEnabled: true,
    }
  })

export const aiConfigurationFactory = Factory.define<AiConfigurationProps>(
  () => {
    return {
      createdByUserId: randomUUID(),
      ownedByOrganizationId: randomUUID(),
      createdAt: nowDate,
      updatedAt: nowDate,
      id: randomUUID(),
      provider: AiProvider.Mistral,
      model: 'codestral-latest',
      isEnabled: true,
    }
  },
)
