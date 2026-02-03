import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { EnvironmentService } from "../aas/presentation/environment.service";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TemplateRepository } from "../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../templates/infrastructure/template.schema";
import { UniqueProductIdentifierDoc, UniqueProductIdentifierSchema } from "../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { PassportRepository } from "./infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "./infrastructure/passport.schema";
import { PassportController } from "./presentation/passport.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
    ]),
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [EnvironmentService, TemplateRepository, UniqueProductIdentifierService, PassportRepository],
  exports: [PassportRepository],
})
export class PassportsModule {}
