import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ItemsModule } from '../items/items.module';
import { ModelsModule } from '../models/models.module';
import { TemplateModule } from '../templates/template.module';
import { INestApplication } from '@nestjs/common';

export function buildOpenApiDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('open-dpp')
    .setDescription('API specification for open-dpp')
    .setVersion('1.0')
    .addTag('open-dpp')
    .addSecurity('api_token', {
      type: 'apiKey',
      in: 'header',
      name: 'api_token',
      description: 'API key authentication',
    })
    .addServer('http://localhost:3000', 'Local') // Add server URL and description
    .addServer('https://api.cloud.open-dpp.de', 'Production')
    .addSecurityRequirements('api_token')
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      include: [ItemsModule, ModelsModule, TemplateModule],
    });
  SwaggerModule.setup('api', app, documentFactory);
}
