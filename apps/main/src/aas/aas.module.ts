import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../organizations/organizations.module";
import { AasRepository } from "./infrastructure/aas.repository";
import { PassportRepository } from "./infrastructure/passport.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./infrastructure/schemas/asset-administration-shell.schema";
import { PassportDoc, PassportSchema } from "./infrastructure/schemas/passport.schema";
import { SubmodelDoc, SubmodelSchema } from "./infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "./infrastructure/submodel.repository";
import { PassportController } from "./presentation/passport.controller";
import { SubmodelRegistryInitializer } from "./presentation/submodel-registry-initializer";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
    ]),
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [SubmodelRegistryInitializer, PassportRepository, AasRepository, SubmodelRepository],
  exports: [PassportRepository, AasRepository, SubmodelRepository],
})
export class AasModule {}
