import { migratePassportDocToTemplateId } from '../../product-passport-data/infrastructure/migrations';
import { ItemDoc, ItemDocSchemaVersion } from './item.schema';

function migrateToVersion_1_0_2(itemDoc: ItemDoc) {
  migratePassportDocToTemplateId(itemDoc);
  itemDoc._schemaVersion = ItemDocSchemaVersion.v1_0_2;
}

export function migrateItemDoc(itemDoc: ItemDoc) {
  if (itemDoc._schemaVersion === ItemDocSchemaVersion.v1_0_1) {
    migrateToVersion_1_0_2(itemDoc);
  }
}
