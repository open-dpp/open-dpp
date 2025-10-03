import { setupServer } from 'msw/node'
import { aiConfigurationHandler } from './handlers/ai-configurations'

const handlers = [...aiConfigurationHandler]

export const server = setupServer(...handlers)
