import { randomUUID } from 'node:crypto'
import { ValueError } from '@open-dpp/exception'

export const AiProvider = {
  Ollama: 'ollama',
  Mistral: 'mistral',
} as const

export type AiProvider_TYPE = (typeof AiProvider)[keyof typeof AiProvider]

const mistralModels = ['codestral-latest']
const ollamaModels = ['qwen3:0.6b']

export interface AiConfigurationCreationProps {
  provider: AiProvider_TYPE
  model: string
  ownedByOrganizationId: string
  createdByUserId: string
  isEnabled: boolean
}

export type AiConfigurationProps = AiConfigurationCreationProps & {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface AiConfigurationUpdate {
  provider: AiProvider_TYPE
  model: string
  isEnabled: boolean
}

export class AiConfiguration {
  public readonly id: string
  public readonly ownedByOrganizationId: string
  public readonly createdByUserId: string
  public provider: AiProvider_TYPE
  public model: string
  public isEnabled: boolean
  public readonly createdAt: Date
  public readonly updatedAt: Date

  private constructor(
    id: string,
    ownedByOrganizationId: string,
    createdByUserId: string,
    provider: AiProvider_TYPE,
    model: string,
    isEnabled: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.assertValidModelForProvider(provider, model)
    this.id = id
    this.ownedByOrganizationId = ownedByOrganizationId
    this.createdByUserId = createdByUserId
    this.provider = provider
    this.model = model
    this.isEnabled = isEnabled
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data: AiConfigurationCreationProps): AiConfiguration {
    const now = new Date(Date.now())
    return new AiConfiguration(
      randomUUID(),
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.provider,
      data.model,
      data.isEnabled,
      now,
      now,
    )
  }

  static loadFromDb(data: AiConfigurationProps): AiConfiguration {
    return new AiConfiguration(
      data.id,
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.provider,
      data.model,
      data.isEnabled,
      data.createdAt,
      data.updatedAt,
    )
  }

  isOwnedBy(organizationId: string) {
    return this.ownedByOrganizationId === organizationId
  }

  update(data: AiConfigurationUpdate) {
    this.assertValidModelForProvider(data.provider, data.model)
    this.model = data.model
    this.provider = data.provider
    this.isEnabled = data.isEnabled
  }

  private assertValidModelForProvider(provider: AiProvider_TYPE, model: string) {
    const valid = provider === AiProvider.Ollama ? ollamaModels : mistralModels
    if (!valid.includes(model)) {
      throw new ValueError(`Invalid model ${model} for provider ${provider}`)
    }
  }
}
