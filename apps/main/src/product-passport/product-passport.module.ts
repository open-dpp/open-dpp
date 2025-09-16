import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from '../unique-product-identifier/infrastructure/unique-product-identifier.schema';
import { ItemDoc, ItemSchema } from '../items/infrastructure/item.schema';
import { ModelDoc, ModelSchema } from '../models/infrastructure/model.schema';
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema';
import { UniqueProductIdentifierService } from '../unique-product-identifier/infrastructure/unique-product-identifier.service';
import { ModelsService } from '../models/infrastructure/models.service';
import { TemplateService } from '../templates/infrastructure/template.service';
import { ItemsService } from '../items/infrastructure/items.service';
import { ProductPassportController } from './presentation/product-passport.controller';

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
  ],
  controllers: [ProductPassportController],
  providers: [
    UniqueProductIdentifierService,
    ModelsService,
    TemplateService,
    ItemsService,
  ],
  exports: [],
})
export class ProductPassportModule {}
