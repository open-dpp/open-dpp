import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { ItemsModule } from "../items/items.module";
import { ModelsModule } from "../models/models.module";
import { PassportsModule } from "../passports/passports.module";
import { TemplatesModule } from "../templates/templates.module";

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
  const documentFactory = () =>
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config, {
      include: [ItemsModule, ModelsModule, TemplatesModule, PassportsModule],
    }));
  SwaggerModule.setup("api", app, documentFactory);
}
