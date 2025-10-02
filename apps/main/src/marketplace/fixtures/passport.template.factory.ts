import type {
  PassportTemplateDto,
} from '@open-dpp/api-client'
import { randomUUID } from 'node:crypto'
import {
  SectionType,
  Sector,
  VisibilityLevel,
} from '@open-dpp/api-client'
import { Factory } from 'fishery'
import { DataFieldType } from '../../data-modelling/domain/data-field-base'
import { GranularityLevel } from '../../data-modelling/domain/granularity-level'
import { TemplateDocSchemaVersion } from '../../templates/infrastructure/template.schema'

export const nowDate = new Date('2025-01-01T12:00:00Z')

export const templateDataFactory = Factory.define<Record<string, unknown>>(
  () => ({
    _id: 'product-123',
    name: 'Sample Product',
    version: '1.0.0',
    visibility: VisibilityLevel.PUBLIC,
    _schemaVersion: TemplateDocSchemaVersion.v1_0_1,
    sections: [
      {
        _id: 'section-1',
        name: 'General Info',
        type: SectionType.GROUP,
        granularityLevel: GranularityLevel.MODEL,
        dataFields: [
          {
            _id: 'field-1',
            name: 'Product Name',
            type: DataFieldType.TEXT_FIELD,
            options: { min: 2 },
            granularityLevel: GranularityLevel.MODEL,
          },
        ],
        subSections: [],
        parentId: undefined,
      },
    ],
    createdByUserId: 'user-123',
    ownedByOrganizationId: 'org-123',
    marketplaceResourceId: null,
  }),
)

export const passportTemplateDtoFactory = Factory.define<PassportTemplateDto>(
  ({ params }) => ({
    id: randomUUID(),
    version: '1.0.0',
    name: 'Template name',
    description: `Template description`,
    sectors: [Sector.BATTERY],
    organizationName: 'My orga',
    createdByUserId: params.createdByUserId ?? randomUUID(),
    ownedByOrganizationId: params.ownedByOrganizationId ?? randomUUID(),
    contactEmail: 'user@example.com',
    templateData: templateDataFactory.build({
      createdByUserId: params.createdByUserId ?? randomUUID(),
      ownedByOrganizationId: params.ownedByOrganizationId ?? randomUUID(),
    }),
    isOfficial: false,
    createdAt: nowDate.toISOString(),
    updatedAt: nowDate.toISOString(),
  }),
)
