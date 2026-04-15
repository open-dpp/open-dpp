import type { INestApplication } from "@nestjs/common";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { createDocument } from "zod-openapi";
import { aasPaths } from "./aas.paths";

const document = createDocument({
  openapi: "3.1.0",
  info: {
    title: "open-dpp API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local test server",
    },
  ],
  paths: {
    ...aasPaths,
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
        description: "Organization identifier",
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "JWT token passed in the x-api-key header",
      },
    },
  },
});

export function buildOpenApiDocumentation(): OpenAPIObject {
  return JSON.parse(JSON.stringify(document)) as unknown as OpenAPIObject;
}

export function addSwaggerToApp(app: INestApplication, openApiDoc: OpenAPIObject) {
  SwaggerModule.setup("api", app, openApiDoc);
}
