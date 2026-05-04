import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { AuthModule } from "../identity/auth/auth.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { TemplateRepository } from "../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../templates/infrastructure/template.schema";
import { UniqueProductIdentifierRepository } from "../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { PassportService } from "./application/services/passport.service";
import { PassportRepository } from "./infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "./infrastructure/passport.schema";
import { PassportController } from "./presentation/passport.controller";
import { ActivityHistoryModule } from "../activity-history/activity-history.module";

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
    ActivityHistoryModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [
    TemplateRepository,
    UniqueProductIdentifierRepository,
    PassportRepository,
    PassportService,
  ],
  exports: [PassportRepository, PassportService],
})
export class PassportsModule {}
