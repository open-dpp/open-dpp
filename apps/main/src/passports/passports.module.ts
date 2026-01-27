import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { EnvironmentService } from "../aas/presentation/environment.service";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TemplateRepository } from "../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../templates/infrastructure/template.schema";
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
    ]),
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [EnvironmentService, TemplateRepository, PassportRepository],
  exports: [PassportRepository],
})
export class PassportsModule {}
