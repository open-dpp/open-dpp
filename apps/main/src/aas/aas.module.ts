import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { MediaModule } from "../media/media.module";
import { AasRepository } from "./infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "./infrastructure/concept-description.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./infrastructure/schemas/asset-administration-shell.schema";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "./infrastructure/schemas/concept-description.schema";
import { SecurityDbSchema, SecurityDoc } from "./infrastructure/schemas/security/security-db-schema";
import { SubmodelDoc, SubmodelSchema } from "./infrastructure/schemas/submodel.schema";
import { SecurityRepository } from "./infrastructure/security.repository";
import { AasSerializationService } from "./infrastructure/serialization/aas-serialization.service";
import { SubmodelRepository } from "./infrastructure/submodel.repository";
import { EnvironmentService } from "./presentation/environment.service";
import { SubmodelRegistryInitializer } from "./presentation/submodel-registry-initializer";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
      { name: SubmodelDoc.name, schema: SubmodelSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
      { name: SecurityDoc.name, schema: SecurityDbSchema },
    ]),
    OrganizationsModule,
    MediaModule,
  ],
  providers: [
    SubmodelRegistryInitializer,
    AasRepository,
    SecurityRepository,
    SubmodelRepository,
    ConceptDescriptionRepository,
    EnvironmentService,
    AasSerializationService,
  ],
  exports: [AasRepository, SecurityRepository, SubmodelRepository, EnvironmentService, AasSerializationService],
})
export class AasModule { }
