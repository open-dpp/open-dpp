import { setupServer } from "msw/node";
import { organizationHandlers } from "./handlers/organization";
import { aasHandlers } from "./handlers/aas";
import { aasIntegrationHandlers } from "./handlers/aas-integration";
import { passportsHandlers } from "./handlers/passports";
import { templatesHandlers } from "./handlers/templates";
import { uniqueProductIdentifierHandlers } from "./handlers/unique-product-identifiers";
import { userHandlers } from "./handlers/users";
import { digitalProductDocumentHandlers } from "./handlers/digital-product-documents";

const handlers = [
  ...uniqueProductIdentifierHandlers,
  ...organizationHandlers,
  ...userHandlers,
  ...aasIntegrationHandlers,
  ...aasHandlers("templates"),
  ...aasHandlers("passports"),
  ...digitalProductDocumentHandlers("templates"),
  ...digitalProductDocumentHandlers("passports"),
  ...templatesHandlers(),
  ...passportsHandlers(),
];

export const server = setupServer(...handlers);
