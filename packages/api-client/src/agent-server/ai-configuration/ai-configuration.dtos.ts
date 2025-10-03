export enum AiProvider {
  Ollama = 'ollama',
  Mistral = 'mistral',
}

export interface AiConfigurationUpsertDto {
  provider: AiProvider
  model: string
  isEnabled: boolean
}

export interface AiConfigurationDto {
  id: string
  ownedByOrganizationId: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  provider: AiProvider
  model: string
  isEnabled: boolean
}
