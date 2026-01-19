import type { INestApplication } from "@nestjs/common";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { createDocument } from "zod-openapi";
import { aasPaths } from "./aas.paths";

const document
  = createDocument({
    openapi: "3.1.0",
    info: {
      title: "open-dpp API",
      version: "1.0.0",
    },
    paths: {
      ...aasPaths,
    },
  });

export function buildOpenApiDocumentation(app: INestApplication) {
  const swaggerDoc = JSON.parse(JSON.stringify(document)) as unknown as OpenAPIObject;
  SwaggerModule.setup("api", app, swaggerDoc);
}
