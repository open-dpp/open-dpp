import type { ProductPassport } from '../../domain/product-passport'
import { z } from 'zod/v4'
import {
  SectionBaseDtoSchema,
  sectionToDto,
} from '../../../data-modelling/presentation/dto/section-base.dto'

const DataSectionDtoSchema = SectionBaseDtoSchema.extend({
  dataValues: z.record(z.string(), z.unknown()).array(),
})

const ProductPassportDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dataSections: DataSectionDtoSchema.array(),
})

export type ProductPassportDto = z.infer<typeof ProductPassportDtoSchema>

export function productPassportToDto(
  productPassport: ProductPassport,
): ProductPassportDto {
  return ProductPassportDtoSchema.parse({
    id: productPassport.id,
    name: productPassport.name,
    description: productPassport.description,
    dataSections: productPassport.dataSections.map(dataSection => ({
      ...sectionToDto(dataSection),
      dataValues: dataSection.dataValues,
    })),
  })
}
