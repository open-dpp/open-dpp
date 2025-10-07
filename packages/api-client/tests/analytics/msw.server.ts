import { setupServer } from 'msw/node'
import { passportMetricHandler } from './handlers/passport-metrics'

const handlers = [...passportMetricHandler]

export const server = setupServer(...handlers)
