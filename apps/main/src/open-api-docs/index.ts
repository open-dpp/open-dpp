import type { INestApplication } from "@nestjs/common";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { createDocument } from "zod-openapi";
import { aasPaths } from "./aas.paths";
import { brandingPaths } from "./branding.path";
import { userPaths } from "./user.paths";
import { organizationsPaths } from "./organization.paths";

const document = createDocument({
  openapi: "3.1.0",
  info: {
    title: "open-dpp API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://app.cloud.open-dpp.de/api",
      description: "Production server",
    },
    {
      url: "https://app.demo1.open-dpp.de/api",
      description: "Test server",
    },
    {
      url: "http://localhost:3000/api",
      description: "Local development server",
    },
  ],
  paths: {
    ...aasPaths,
    ...brandingPaths,
    ...userPaths,
    ...organizationsPaths,
  },
  components: {
    parameters: {
      OrganizationIdHeader: {
        name: "x-open-dpp-organization-id",
        in: "header",
        required: true,
        schema: {
          type: "string",
        },
        example: "690cf22459cdae7ce188c1f8",
        description: "Organization identifier",
      },
    },
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API Key passed in the x-api-key header",
      },
    },
  },
});

export function buildOpenApiDocumentation(): OpenAPIObject {
  return JSON.parse(JSON.stringify(document)) as unknown as OpenAPIObject;
}

export function addSwaggerToApp(app: INestApplication, openApiDoc: OpenAPIObject) {
  SwaggerModule.setup("api", app, openApiDoc, { jsonDocumentUrl: "api.json" });
}
