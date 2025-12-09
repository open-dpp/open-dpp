import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { createDocument } from "zod-openapi";
import { SubmodelBaseUnionSchema } from "../aas/domain/parsing/submodel-base/submodel-base-union-schema";

const document
  = createDocument({
    openapi: "3.1.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
    paths: {
      "/jobs/{jobId}": {
        put: {
          responses: {
            200: {
              description: "200 OK",
              content: {
                "application/json": { schema: SubmodelBaseUnionSchema },
              },
            },
          },
        },
      },
    },
  });

export function buildOpenApiDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("open-dpp")
    .setDescription("API specification for open-dpp")
    .setVersion("1.0")
    .addTag("open-dpp")
    .addSecurity("api_token", {
      type: "apiKey",
      in: "header",
      name: "api_token",
      description: "API key authentication",
    })
    .addServer("http://localhost:3000", "Local") // Add server URL and description
    .addServer("https://api.cloud.open-dpp.de", "Production")
    .addSecurityRequirements("api_token")
    .build();
  // const documentFactory = () =>
  //   cleanupOpenApiDoc(SwaggerModule.createDocument(app, config, {
  //     include: [ItemsModule, ModelsModule, TemplatesModule, PassportsModule],
  //   }));
  const swaggerDoc = JSON.parse(JSON.stringify(document)) as unknown as OpenAPIObject;
  SwaggerModule.setup("api", app, swaggerDoc);
}
