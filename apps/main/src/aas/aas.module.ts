import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { MediaModule } from "../media/media.module";
import { PresentationConfigurationsModule } from "../presentation-configurations/presentation-configurations.module";
import { AasRepository } from "./infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "./infrastructure/concept-description.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./infrastructure/schemas/asset-administration-shell.schema";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "./infrastructure/schemas/concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "./infrastructure/schemas/submodel.schema";
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
    ]),
    OrganizationsModule,
    MediaModule,
    forwardRef(() => PresentationConfigurationsModule),
  ],
  providers: [
    SubmodelRegistryInitializer,
    AasRepository,
    SubmodelRepository,
    ConceptDescriptionRepository,
    EnvironmentService,
    AasSerializationService,
  ],
  exports: [AasRepository, SubmodelRepository, EnvironmentService, AasSerializationService],
})
export class AasModule {}
