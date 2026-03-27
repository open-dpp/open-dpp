import { setupServer } from "msw/node";
import { organizationHandlers } from "../organization";
import { aasHandlers } from "./handlers/aas";
import { aasIntegrationHandlers } from "./handlers/aas-integration";
import { passportsHandlers } from "./handlers/passports";
import { templatesHandlers } from "./handlers/templates";
import { uniqueProductIdentifierHandlers } from "./handlers/unique-product-identifiers";

const handlers = [
  ...uniqueProductIdentifierHandlers,
  ...organizationHandlers,
  ...aasIntegrationHandlers,
  ...aasHandlers("templates"),
  ...aasHandlers("passports"),
  ...templatesHandlers(),
  ...passportsHandlers(),
];

export const server = setupServer(...handlers);
