import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { AasRepository } from "./infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "./infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "./infrastructure/submodel.repository";
import { EnvironmentService } from "./presentation/environment.service";
import { SubmodelRegistryInitializer } from "./presentation/submodel-registry-initializer";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
    ]),
    OrganizationsModule,
  ],
  providers: [SubmodelRegistryInitializer, AasRepository, SubmodelRepository, EnvironmentService],
  exports: [AasRepository, SubmodelRepository, EnvironmentService],
})
export class AasModule { }
