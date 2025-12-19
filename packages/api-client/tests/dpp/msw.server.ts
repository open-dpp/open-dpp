import { setupServer } from 'msw/node'
import { organizationHandlers } from '../organization'
import { aasHandlers } from './handlers/aas'
import { aasIntegrationHandlers } from './handlers/aas-integration'
import { itemHandlers } from './handlers/item'
import { modelHandlers } from './handlers/model'
import { productPassportHandlers } from './handlers/product-passport'
import { templateHandlers } from './handlers/template'
import { templateDraftsHandlers } from './handlers/template-draft'
import { uniqueProductIdentifierHandlers } from './handlers/unique-product-identifiers'

const handlers = [
  ...modelHandlers,
  ...itemHandlers,
  ...templateHandlers,
  ...templateDraftsHandlers,
  ...uniqueProductIdentifierHandlers,
  ...productPassportHandlers,
  ...organizationHandlers,
  ...aasIntegrationHandlers,
  ...aasHandlers('templates'),
]

export const server = setupServer(...handlers)
