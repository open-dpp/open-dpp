import type { SectionDraft } from '../../../template-draft/domain/section-draft'
import type { Section } from '../../../templates/domain/section'
import { z } from 'zod'
import { GranularityLevel } from '../../domain/granularity-level'
import { SectionType } from '../../domain/section-base'
import { DataFieldBaseSchema, dataFieldToDto } from './data-field-base.dto'

export const SectionBaseDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  type: z.enum(SectionType),
  parentId: z.string().optional(),
  subSections: z.string().array(),
  dataFields: DataFieldBaseSchema.array(),
  granularityLevel: z.enum(GranularityLevel).optional(),
})

export function sectionToDto(section: Section | SectionDraft) {
  return SectionBaseDtoSchema.parse({
    id: section.id,
    name: section.name,
    type: section.type,
    dataFields: section.dataFields.map(dataField =>
      dataFieldToDto(dataField),
    ),
    parentId: section.parentId,
    subSections: section.subSections,
    granularityLevel: section.granularityLevel,
  })
}
