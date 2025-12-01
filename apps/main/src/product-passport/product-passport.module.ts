import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { ItemDoc, ItemSchema } from "../items/infrastructure/item.schema";
import { ItemsService } from "../items/infrastructure/items.service";
import { ModelDoc, ModelSchema } from "../models/infrastructure/model.schema";
import { ModelsService } from "../models/infrastructure/models.service";
import {
  TemplateDoc,
  TemplateSchema,
} from "../templates/infrastructure/template.schema";
import { TemplateService } from "../templates/infrastructure/template.service";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { ProductPassportController } from "./presentation/product-passport.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
      {
        name: ItemDoc.name,
        schema: ItemSchema,
      },
      {
        name: ModelDoc.name,
        schema: ModelSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    AuthModule,
  ],
  controllers: [ProductPassportController],
  providers: [
    UniqueProductIdentifierService,
    ModelsService,
    TemplateService,
    ItemsService,
  ],
})
export class ProductPassportModule {}
