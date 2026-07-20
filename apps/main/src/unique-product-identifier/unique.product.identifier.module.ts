import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { InstanceSettingsModule } from "../instance-settings/instance-settings.module";
import { PassportsModule } from "../passports/passports.module";
import { PermalinkModule } from "../permalink/permalink.module";
import { Gs1IdentityService } from "./application/services/gs1-identity.service";
import { UpiCollectionService } from "./application/services/upi-collection.service";
import { UniqueProductIdentifierRepository } from "./infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
import { Gs1IdentityController } from "./presentation/gs1-identity.controller";
import { Gs1ResolverController } from "./presentation/gs1-resolver.controller";
import { PassportUniqueProductIdentifierController } from "./presentation/passport-unique-product-identifier.controller";
import { UniqueProductIdentifierController } from "./presentation/unique-product-identifier.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
    ]),
    EnvModule,
    InstanceSettingsModule,
    forwardRef(() => PassportsModule),
    forwardRef(() => PermalinkModule),
  ],
  controllers: [
    Gs1ResolverController,
    Gs1IdentityController,
    UniqueProductIdentifierController,
    PassportUniqueProductIdentifierController,
  ],
  providers: [
    UniqueProductIdentifierRepository,
    Gs1IdentityService,
    UpiCollectionService,
  ],
  exports: [
    UniqueProductIdentifierRepository,
    Gs1IdentityService,
    UpiCollectionService,
  ],
})
export class UniqueProductIdentifierModule {}
