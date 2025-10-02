import type { ItemDbProps } from '../../items/domain/item'
import type { ModelDbProps } from '../../models/domain/model'
import type { TemplateDbProps } from '../../templates/domain/template'
import { randomUUID } from 'node:crypto'
import { Sector } from '@open-dpp/api-client'
import { Factory } from 'fishery'
import { DataFieldType } from '../../data-modelling/domain/data-field-base'
import { GranularityLevel } from '../../data-modelling/domain/granularity-level'
import { SectionType } from '../../data-modelling/domain/section-base'
import { DataValue } from '../../product-passport-data/domain/data-value'
import { sectionDbPropsFactory } from '../../templates/fixtures/section.factory'

export class PhoneFactory extends Factory<TemplateDbProps> {
  static ids = {
    section1: {
      id: randomUUID(),
      fields: {
        dataField1: randomUUID(),
        dataField2: randomUUID(),
      },
    },
    section2: {
      id: randomUUID(),
      fields: {
        dataField3: randomUUID(),
        dataField4: randomUUID(),
      },
    },
    section3: {
      id: randomUUID(),
      fields: {
        dataFieldId5: randomUUID(),
        dataFieldIdForItem5: randomUUID(),
      },
    },
    sectionForItem1: {
      id: randomUUID(),
      fields: {
        dataFieldIdForItem1: randomUUID(),
        dataFieldIdForItem2: randomUUID(),
      },
    },
    sectionForItem2: {
      id: randomUUID(),
      fields: {
        dataFieldIdForItem3: randomUUID(),
        dataFieldIdForItem4: randomUUID(),
      },
    },
  }

  section1() {
    return sectionDbPropsFactory.params({
      type: SectionType.REPEATABLE,
      id: PhoneFactory.ids.section1.id,
      parentId: undefined,
      name: 'Repeating Section',
      granularityLevel: GranularityLevel.MODEL,
      subSections: [],
      dataFields: [
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section1.fields.dataField1,
          name: 'Title 1',
          options: { min: 2 },
          granularityLevel: GranularityLevel.MODEL,
        },
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section1.fields.dataField2,
          name: 'Title 2',
          options: { min: 7 },
          granularityLevel: GranularityLevel.MODEL,
        },
      ],
    })
  }

  section2() {
    return sectionDbPropsFactory.params({
      id: PhoneFactory.ids.section2.id,
      type: SectionType.GROUP,
      name: 'Group Section',
      subSections: [],
      granularityLevel: GranularityLevel.MODEL,
      dataFields: [
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section2.fields.dataField3,
          name: 'Title 3',
          options: { min: 8 },
          granularityLevel: GranularityLevel.MODEL,
        },
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section2.fields.dataField4,
          name: 'Title 4',
          options: { min: 8 },
          granularityLevel: GranularityLevel.MODEL,
        },
      ],
    })
  }

  section3() {
    return sectionDbPropsFactory.params({
      type: SectionType.GROUP,
      id: PhoneFactory.ids.section3.id,
      name: 'Group Section 2',
      subSections: [],
      dataFields: [
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section3.fields.dataFieldId5,
          name: 'Title sg21',
          options: { min: 8 },
          granularityLevel: GranularityLevel.MODEL,
        },
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.section3.fields.dataFieldIdForItem5,
          name: 'Title sg21 for item',
          options: { min: 8 },
          granularityLevel: GranularityLevel.ITEM,
        },
      ],
    })
  }

  sectionForItem1() {
    return sectionDbPropsFactory.params({
      type: SectionType.REPEATABLE,
      id: PhoneFactory.ids.sectionForItem1.id,
      name: 'Repeating Section for item',
      granularityLevel: GranularityLevel.ITEM,
      subSections: [],
      dataFields: [
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem1,
          name: 'Title 1 for item',
          options: { min: 7 },
          granularityLevel: GranularityLevel.ITEM,
        },
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem2,
          name: 'Title 2 for item',
          options: { min: 7 },
          granularityLevel: GranularityLevel.ITEM,
        },
      ],
    })
  }

  sectionForItem2() {
    return sectionDbPropsFactory.params({
      type: SectionType.GROUP,
      id: PhoneFactory.ids.sectionForItem2.id,
      name: 'Group Section for item',
      subSections: [],
      granularityLevel: GranularityLevel.ITEM,
      dataFields: [
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem3,
          name: 'Title 3 for item',
          options: { min: 8 },
          granularityLevel: GranularityLevel.ITEM,
        },
        {
          type: DataFieldType.TEXT_FIELD,
          id: PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem4,
          name: 'Title 4 for item',
          options: { min: 8 },
          granularityLevel: GranularityLevel.ITEM,
        },
      ],
    })
  }

  addSections() {
    return this.params({
      sections: [
        this.section1().build({
          subSections: [PhoneFactory.ids.section2.id],
        }),
        this.section2().build({ parentId: PhoneFactory.ids.section1.id }),
        this.sectionForItem1().build({
          subSections: [PhoneFactory.ids.sectionForItem2.id],
        }),
        this.sectionForItem2().build({
          parentId: PhoneFactory.ids.sectionForItem1.id,
        }),
        this.section3().build(),
      ],
    })
  }
}

export const phoneFactory = PhoneFactory.define(() => ({
  id: randomUUID(),
  marketplaceResourceId: null,
  description: 'My phone',
  sectors: [Sector.ELECTRONICS],
  name: 'Phone',
  version: '1.0.0',
  organizationId: randomUUID(),
  userId: randomUUID(),
  sections: [],
}))

export class PhoneModelFactory extends Factory<ModelDbProps> {
  dataValuesSection1() {
    return [
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section1.fields.dataField1,
        dataSectionId: PhoneFactory.ids.section1.id,
        value: 'val1,0',
        row: 0,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section1.fields.dataField2,
        dataSectionId: PhoneFactory.ids.section1.id,
        value: 'val2,0',
        row: 0,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section1.fields.dataField1,
        dataSectionId: PhoneFactory.ids.section1.id,
        value: 'val1,1',
        row: 1,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section1.fields.dataField2,
        dataSectionId: PhoneFactory.ids.section1.id,
        value: 'val2,1',
        row: 1,
      }),
    ]
  }

  dataValuesSection2() {
    return [
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section2.fields.dataField3,
        dataSectionId: PhoneFactory.ids.section2.id,
        value: 'val3,0',
        row: 0,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section2.fields.dataField4,
        dataSectionId: PhoneFactory.ids.section2.id,
        value: 'val4,0',
        row: 0,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section2.fields.dataField3,
        dataSectionId: PhoneFactory.ids.section2.id,
        value: 'val3,1',
        row: 1,
      }),
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section2.fields.dataField4,
        dataSectionId: PhoneFactory.ids.section2.id,
        value: 'val4,1',
        row: 1,
      }),
    ]
  }

  dataValuesSection3() {
    return [
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section3.fields.dataFieldId5,
        dataSectionId: PhoneFactory.ids.section3.id,
        value: 'val5,0',
        row: 0,
      }),
    ]
  }

  addDataValues() {
    return this.params({
      dataValues: [
        ...this.dataValuesSection1(),
        ...this.dataValuesSection2(),
        ...this.dataValuesSection3(),
      ],
    })
  }
}

export const phoneModelFactory = PhoneModelFactory.define(() => ({
  id: randomUUID(),
  name: 'Model Y',
  description: 'My desc',
  templateId: randomUUID(),
  organizationId: randomUUID(),
  userId: randomUUID(),
  uniqueProductIdentifiers: [],
  dataValues: [],
}))

export class PhoneItemFactory extends Factory<ItemDbProps> {
  dataValuesSectionForItem1() {
    return [
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem1,
        dataSectionId: PhoneFactory.ids.sectionForItem1.id,
        value: 'val1,0,item',
        row: 0,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem2,
        dataSectionId: PhoneFactory.ids.sectionForItem1.id,
        value: 'val2,0,item',
        row: 0,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem1,
        dataSectionId: PhoneFactory.ids.sectionForItem1.id,
        value: 'val1,1,item',
        row: 1,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem2,
        dataSectionId: PhoneFactory.ids.sectionForItem1.id,
        value: 'val2,1,item',
        row: 1,
      }),
    ]
  }

  dataValuesSectionForItem2() {
    return [
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem3,
        dataSectionId: PhoneFactory.ids.sectionForItem2.id,
        value: 'val3,0,item',
        row: 0,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem4,
        dataSectionId: PhoneFactory.ids.sectionForItem2.id,
        value: 'val4,0,item',
        row: 0,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem3,
        dataSectionId: PhoneFactory.ids.sectionForItem2.id,
        value: 'val3,1,item',
        row: 1,
      }),
      DataValue.create({
        dataFieldId:
          PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem4,
        dataSectionId: PhoneFactory.ids.sectionForItem2.id,
        value: 'val4,1,item',
        row: 1,
      }),
    ]
  }

  dataValuesSection3() {
    return [
      DataValue.create({
        dataFieldId: PhoneFactory.ids.section3.fields.dataFieldIdForItem5,
        dataSectionId: PhoneFactory.ids.section3.id,
        value: 'val5,0,item',
        row: 0,
      }),
    ]
  }

  addDataValues() {
    return this.params({
      dataValues: [
        ...this.dataValuesSectionForItem1(),
        ...this.dataValuesSectionForItem2(),
        ...this.dataValuesSection3(),
      ],
    })
  }
}

export const phoneItemFactory = PhoneItemFactory.define(({ params }) => {
  const id = params.id ?? randomUUID()
  return {
    id,
    templateId: randomUUID(),
    organizationId: randomUUID(),
    userId: randomUUID(),
    modelId: randomUUID(),
    uniqueProductIdentifiers: [
      {
        uuid: randomUUID(),
        referenceId: id,
      },
    ],
    dataValues: [],
  }
})
