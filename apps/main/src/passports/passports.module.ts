import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AasModule } from "../aas/aas.module";

import { EnvironmentService } from "../aas/presentation/environment.service";
import { OrganizationsModule } from "../organizations/organizations.module";
import { AuthModule } from "../identity/auth/auth.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
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
    ]),
    AasModule,
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [EnvironmentService, PassportRepository],
  exports: [PassportRepository],
})
export class PassportsModule {}
