import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportsModule } from "../passports/passports.module";
import { UniqueProductIdentifierRepository } from "./infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierApplicationService } from "./presentation/unique.product.identifier.application.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
    ]),
    PassportsModule,
  ],
  providers: [UniqueProductIdentifierApplicationService, UniqueProductIdentifierRepository],
  exports: [UniqueProductIdentifierRepository, UniqueProductIdentifierApplicationService],
})
export class UniqueProductIdentifierModule {}
