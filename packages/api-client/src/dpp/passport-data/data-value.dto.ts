import type { UniqueProductIdentifierDto } from '../unique-product-identifiers/unique-product-identifiers.dtos'

export interface DataValueDto {
  row: number
  value: unknown
  dataSectionId: string
  dataFieldId: string
}

export interface ProductPassportDataDto {
  id: string
  uniqueProductIdentifiers: UniqueProductIdentifierDto[]
  templateId: string
  dataValues: DataValueDto[]
}
