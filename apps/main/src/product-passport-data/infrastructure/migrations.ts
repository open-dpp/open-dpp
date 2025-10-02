import type { PassportDoc } from './product-passport-data.schema'

export function migratePassportDocToTemplateId(passportDoc: PassportDoc) {
  if (passportDoc.productDataModelId) {
    passportDoc.templateId = passportDoc.productDataModelId
  }
}
