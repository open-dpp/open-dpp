import {
  aiConfigurationCreationFactory,
  aiConfigurationFactory,
} from '../fixtures/ai-configuration-props.factory'
import { AiConfiguration, AiProvider } from './ai-configuration'

describe('aiConfiguration', () => {
  it('is created', () => {
    const props = aiConfigurationCreationFactory.build()

    const aiConfiguration = AiConfiguration.create(props)
    expect(aiConfiguration).toBeInstanceOf(AiConfiguration)
    expect(aiConfiguration.id).toEqual(expect.any(String))
    expect(aiConfiguration.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    )
    expect(aiConfiguration.provider).toEqual(AiProvider.Mistral)
    expect(aiConfiguration.model).toEqual('codestral-latest')
    expect(aiConfiguration.createdByUserId).toEqual(props.createdByUserId)
    expect(aiConfiguration.createdAt).toBeDefined()
    expect(aiConfiguration.createdAt).toBeInstanceOf(Date)
    expect(aiConfiguration.updatedAt).toBeDefined()
    expect(aiConfiguration.updatedAt).toBeInstanceOf(Date)
    expect(aiConfiguration.isEnabled).toEqual(props.isEnabled)
  })

  it('throws error if model does not fit to provider', () => {
    const props = aiConfigurationFactory.build({
      model: 'qwen3:0.6b',
    })
    expect(() => AiConfiguration.create(props)).toThrow(
      'Invalid model qwen3:0.6b for provider mistral',
    )
  })
  it('is loaded from database', () => {
    const props = aiConfigurationFactory.build()

    const aiConfiguration = AiConfiguration.loadFromDb(props)
    expect(aiConfiguration).toBeInstanceOf(AiConfiguration)
    expect(aiConfiguration.id).toEqual(props.id)
    expect(aiConfiguration.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    )
    expect(aiConfiguration.createdByUserId).toEqual(props.createdByUserId)
    expect(aiConfiguration.provider).toEqual(AiProvider.Mistral)
    expect(aiConfiguration.model).toEqual('codestral-latest')
    expect(aiConfiguration.createdAt).toBeDefined()
    expect(aiConfiguration.createdAt).toBeInstanceOf(Date)
    expect(aiConfiguration.updatedAt).toBeDefined()
    expect(aiConfiguration.updatedAt).toBeInstanceOf(Date)
    expect(aiConfiguration.isEnabled).toEqual(props.isEnabled)
  })

  it('is updated', () => {
    const props = aiConfigurationFactory.build({
      isEnabled: true,
      provider: AiProvider.Ollama,
      model: 'qwen3:0.6b',
    })
    const aiConfiguration = AiConfiguration.loadFromDb(props)
    aiConfiguration.update({
      isEnabled: false,
      provider: AiProvider.Mistral,
      model: 'codestral-latest',
    })
    expect(aiConfiguration.isEnabled).toEqual(false)
    expect(aiConfiguration.provider).toEqual(AiProvider.Mistral)
    expect(aiConfiguration.model).toEqual('codestral-latest')
  })
})
