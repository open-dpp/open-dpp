import { setupServer } from 'msw/node'
import { passportHandlers } from './handlers/passport-templates'

const handlers = [...passportHandlers]

export const server = setupServer(...handlers)
