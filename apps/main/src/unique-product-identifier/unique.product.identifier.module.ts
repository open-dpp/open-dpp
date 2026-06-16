import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { InstanceSettingsModule } from "../instance-settings/instance-settings.module";
import { PassportsModule } from "../passports/passports.module";
import { PermalinkModule } from "../permalink/permalink.module";
import { Gs1IdentityService } from "./application/services/gs1-identity.service";
import { Gs1ResolverBaseService } from "./application/services/gs1-resolver-base.service";
import { UpiCollectionService } from "./application/services/upi-collection.service";
import { UniqueProductIdentifierRepository } from "./infrastructure/unique-product-identifier.repository";
import { UpiBackfillService } from "./infrastructure/upi-backfill.service";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
import { Gs1IdentityController } from "./presentation/gs1-identity.controller";
import { Gs1ResolverController } from "./presentation/gs1-resolver.controller";
import { PassportUniqueProductIdentifierController } from "./presentation/passport-unique-product-identifier.controller";
import { UniqueProductIdentifierApplicationService } from "./presentation/unique.product.identifier.application.service";
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
    UniqueProductIdentifierApplicationService,
    UniqueProductIdentifierRepository,
    Gs1IdentityService,
    Gs1ResolverBaseService,
    UpiCollectionService,
    UpiBackfillService,
  ],
  exports: [
    UniqueProductIdentifierRepository,
    UniqueProductIdentifierApplicationService,
    Gs1IdentityService,
    Gs1ResolverBaseService,
    UpiCollectionService,
    UpiBackfillService,
  ],
})
export class UniqueProductIdentifierModule {}
