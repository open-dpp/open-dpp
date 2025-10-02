import type { ModelDoc } from './model.schema'
import { migratePassportDocToTemplateId } from '../../product-passport-data/infrastructure/migrations'
import { ModelDocSchemaVersion } from './model.schema'

function migrateToVersion_1_0_1(modelDoc: ModelDoc) {
  migratePassportDocToTemplateId(modelDoc)
  modelDoc._schemaVersion = ModelDocSchemaVersion.v1_0_1
}

export function migrateModelDoc(modelDoc: ModelDoc) {
  if (modelDoc._schemaVersion === ModelDocSchemaVersion.v1_0_0) {
    migrateToVersion_1_0_1(modelDoc)
  }
}
