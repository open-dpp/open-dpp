import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { AasRepository } from "./infrastructure/aas.repository";
import { PassportRepository } from "./infrastructure/passport.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./infrastructure/schemas/asset-administration-shell.schema";
import { PassportDoc, PassportSchema } from "./infrastructure/schemas/passport.schema";
import { SubmodelDoc, SubmodelSchema } from "./infrastructure/schemas/submodel.schema";
import { TemplateDoc, TemplateSchema } from "./infrastructure/schemas/template.schema";
import { SubmodelRepository } from "./infrastructure/submodel.repository";
import { TemplateRepository } from "./infrastructure/template.repository";
import { EnvironmentService } from "./presentation/environment.service";
import { PassportController } from "./presentation/passport.controller";
import { SubmodelRegistryInitializer } from "./presentation/submodel-registry-initializer";
import { TemplateController } from "./presentation/template.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
      { name: TemplateDoc.name, schema: TemplateSchema },
    ]),
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [PassportController, TemplateController],
  providers: [SubmodelRegistryInitializer, PassportRepository, TemplateRepository, AasRepository, SubmodelRepository, EnvironmentService],
  exports: [PassportRepository, TemplateRepository, AasRepository, SubmodelRepository, EnvironmentService],
})
export class AasModule {}
