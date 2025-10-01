import {
  MoveDirection,
  TemplateDraft,
  TemplateDraftDbProps,
} from './template-draft';
import { DataFieldDraft } from './data-field-draft';
import { SectionDraft } from './section-draft';
import { SectionType } from '../../data-modelling/domain/section-base';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { randomUUID } from 'crypto';
import { Template, TemplateDbProps } from '../../templates/domain/template';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import {
  sectionDraftEnvironment,
  templateDraftCreatePropsFactory,
  templateDraftDbFactory,
} from '../fixtures/template-draft.factory';
import { textFieldProps } from '../fixtures/data-field-draft.factory';
import { sectionDraftDbPropsFactory } from '../fixtures/section-draft.factory';
import { expect } from '@jest/globals';
import { NotFoundError, ValueError } from '@app/exception/domain.errors';
import { ignoreIds } from '@app/testing/utils';

import { Sector } from '../../data-modelling/domain/sectors';

describe('TemplateDraft', () => {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const laptopModel: TemplateDraftDbProps = templateDraftDbFactory.build({
    userId,
    organizationId,
  });

  it('is renamed', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build(),
    );
    productDataModelDraft.rename('Final Draft');
    expect(productDataModelDraft.name).toEqual('Final Draft');
  });

  it('is published', () => {
    const productDataModelDraft = TemplateDraft.loadFromDb(laptopModel);
    const otherUserId = randomUUID();
    const publishedProductDataModel =
      productDataModelDraft.publish(otherUserId);

    const expected: TemplateDbProps = {
      id: randomUUID(),
      marketplaceResourceId: null,
      name: productDataModelDraft.name,
      description: productDataModelDraft.description,
      sectors: [Sector.ELECTRONICS],
      version: '1.0.0',
      organizationId: organizationId,
      userId: otherUserId,
      sections: [
        {
          type: SectionType.GROUP,
          parentId: undefined,
          subSections: [],
          id: productDataModelDraft.sections[0].id,
          granularityLevel: GranularityLevel.MODEL,
          name: 'Umwelt',
          dataFields: [
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[0].dataFields[0].id,
              name: 'Title 1',
              options: { max: 2 },

              granularityLevel: GranularityLevel.MODEL,
            },
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[0].dataFields[1].id,
              name: 'Title 2',
              options: { max: 2 },

              granularityLevel: GranularityLevel.MODEL,
            },
          ],
        },
        {
          type: SectionType.REPEATABLE,
          parentId: undefined,
          subSections: [productDataModelDraft.sections[2].id],
          name: 'Material',
          granularityLevel: GranularityLevel.MODEL,
          id: productDataModelDraft.sections[1].id,

          dataFields: [
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[1].dataFields[0].id,
              name: 'Material Title 1',
              options: { max: 2 },

              granularityLevel: GranularityLevel.MODEL,
            },
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[1].dataFields[1].id,
              name: 'Material Title 2',
              options: { max: 2 },
              granularityLevel: GranularityLevel.MODEL,
            },
          ],
        },
        {
          type: SectionType.GROUP,
          parentId: productDataModelDraft.sections[1].id,
          subSections: [],
          name: 'Measurement',
          granularityLevel: GranularityLevel.MODEL,
          id: productDataModelDraft.sections[2].id,
          dataFields: [
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[2].dataFields[0].id,
              name: 'Measurement Title 1',
              options: { max: 2 },
              granularityLevel: GranularityLevel.MODEL,
            },
            {
              type: DataFieldType.TEXT_FIELD,
              id: productDataModelDraft.sections[2].dataFields[1].id,
              name: 'Measurement Title 2',
              options: { max: 2 },
              granularityLevel: GranularityLevel.MODEL,
            },
          ],
        },
      ],
    };
    expect(publishedProductDataModel).toEqual(
      ignoreIds(Template.loadFromDb(expected)),
    );
    expect(publishedProductDataModel.id).not.toEqual(productDataModelDraft.id);
    expect(productDataModelDraft.publications).toEqual([
      {
        id: publishedProductDataModel.id,
        version: '1.0.0',
      },
    ]);
    const againPublished = productDataModelDraft.publish(otherUserId);
    expect(againPublished.version).toEqual('2.0.0');
    expect(productDataModelDraft.publications).toEqual([
      {
        id: publishedProductDataModel.id,
        version: '1.0.0',
      },
      {
        id: againPublished.id,
        version: '2.0.0',
      },
    ]);
    const parentSection = publishedProductDataModel.sections.find(
      (s) => s.name === 'Material',
    );
    const childSection = publishedProductDataModel.sections.find(
      (s) => s.name === 'Measurement',
    );
    expect(parentSection?.subSections).toEqual([childSection?.id]);
    expect(childSection?.parentId).toEqual(parentSection?.id);
  });

  it('should be created', () => {
    const userId = randomUUID();
    const organizationId = randomUUID();
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    expect(productDataModelDraft.id).toBeDefined();
    expect(productDataModelDraft.version).toEqual('1.0.0');
    expect(productDataModelDraft.sections).toEqual([]);
    expect(productDataModelDraft.isOwnedBy(organizationId)).toBeTruthy();
    expect(productDataModelDraft.createdByUserId).toEqual(userId);
    expect(productDataModelDraft.publications).toEqual([]);
  });

  it('should add sections', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section2 = SectionDraft.create({
      name: 'Material',
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(section1);
    productDataModelDraft.addSection(section2);

    expect(productDataModelDraft.sections).toEqual([section1, section2]);
  });

  it('should fail to add repeater section with parent', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section2 = SectionDraft.create({
      name: 'Material',
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    section2.assignParent(section1);
    productDataModelDraft.addSection(section1);
    expect(() => productDataModelDraft.addSection(section2)).toThrow(
      new ValueError('Repeater section can only be added as root section'),
    );
  });

  it('should add subSection', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section2 = SectionDraft.create({
      name: 'Material',
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(section1);
    productDataModelDraft.addSubSection(section1.id, section2);

    expect(productDataModelDraft.sections[0].subSections).toEqual([
      section2.id,
    ]);
    expect(productDataModelDraft.sections[1].parentId).toEqual(section1.id);
  });

  it('should fail to add subSection if parent id not found', () => {
    const templateDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });

    expect(() => templateDraft.addSubSection('some id', section1)).toThrow(
      new NotFoundError(SectionDraft.name, 'some id'),
    );
  });

  it('should fail to add subSection if its granularity level differs from parent', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const parentSection = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(parentSection);
    const section = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.ITEM,
    });

    expect(() =>
      productDataModelDraft.addSubSection(parentSection.id, section),
    ).toThrow(
      new ValueError(
        `Sub section ${section.id} has a granularity level of ${section.granularityLevel} which does not match the parent section's  granularity level of ${parentSection.granularityLevel}`,
      ),
    );
  });

  it('should set subSection granularity level to parent one if undefined', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const parentSection = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(parentSection);
    const section = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
    });
    productDataModelDraft.addSubSection(parentSection.id, section);

    expect(
      productDataModelDraft.findSectionOrFail(section.id).granularityLevel,
    ).toEqual(parentSection.granularityLevel);
  });

  it('should modify section', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(section);
    productDataModelDraft.modifySection(section.id, {
      name: 'Tracebility',
    });

    expect(productDataModelDraft.sections).toEqual([
      SectionDraft.loadFromDb({
        name: 'Tracebility',
        id: section.id,
        type: section.type,
        subSections: section.subSections,
        parentId: section.parentId,
        dataFields: section.dataFields,
        granularityLevel: section.granularityLevel,
      }),
    ]);
  });

  it('should move section', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({ id: 'section-1' }),
    );
    const subSection11 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({ id: 'sub-section-1-1' }),
    );
    const section2 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({ id: 'section-2' }),
    );
    const subSection12 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({ id: 'sub-section-1-2' }),
    );
    const subSection21 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({
        id: 'sub-section-2-1',
      }),
    );
    const section3 = SectionDraft.create(
      sectionDraftDbPropsFactory.build({ id: 'section-3' }),
    );

    productDataModelDraft.addSection(section1);
    productDataModelDraft.addSubSection(section1.id, subSection11);
    productDataModelDraft.addSection(section2);
    productDataModelDraft.addSubSection(section1.id, subSection12);
    productDataModelDraft.addSubSection(section2.id, subSection21);
    productDataModelDraft.addSection(section3);
    expect(productDataModelDraft.sections).toEqual([
      section1,
      subSection11,
      section2,
      subSection12,
      subSection21,
      section3,
    ]);

    productDataModelDraft.moveSection(section1.id, MoveDirection.DOWN);
    expect(productDataModelDraft.sections).toEqual([
      subSection11,
      section2,
      section1,
      subSection12,
      subSection21,
      section3,
    ]);

    productDataModelDraft.moveSection(section3.id, MoveDirection.UP);
    expect(productDataModelDraft.sections).toEqual([
      subSection11,
      section2,
      section3,
      section1,
      subSection12,
      subSection21,
    ]);

    productDataModelDraft.moveSection(section1.id, MoveDirection.UP);
    productDataModelDraft.moveSection(section1.id, MoveDirection.UP);
    expect(productDataModelDraft.sections).toEqual([
      subSection11,
      section1,
      section2,
      section3,
      subSection12,
      subSection21,
    ]);

    productDataModelDraft.moveSection(subSection12.id, MoveDirection.UP);
    const final = [
      subSection12,
      subSection11,
      section1,
      section2,
      section3,
      subSection21,
    ];
    expect(productDataModelDraft.sections).toEqual(final);

    // the following moves should not change the order of the sections
    productDataModelDraft.moveSection(subSection11.id, MoveDirection.DOWN);
    productDataModelDraft.moveSection(subSection12.id, MoveDirection.UP);
    productDataModelDraft.moveSection(subSection21.id, MoveDirection.UP);
    productDataModelDraft.moveSection(subSection21.id, MoveDirection.DOWN);
    productDataModelDraft.moveSection(section1.id, MoveDirection.UP);
    productDataModelDraft.moveSection(section3.id, MoveDirection.DOWN);
    expect(productDataModelDraft.sections).toEqual(final);
  });

  it('should delete a section', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section1 = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section11 = SectionDraft.create({
      name: 'Dimensions',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section12 = SectionDraft.create({
      name: 'section12',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section111 = SectionDraft.create({
      name: 'Measurement',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section112 = SectionDraft.create({
      name: 'Measurement 2',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section2 = SectionDraft.create({
      name: 'section2',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(section1);
    productDataModelDraft.addSubSection(section1.id, section11);
    productDataModelDraft.addSubSection(section1.id, section12);
    productDataModelDraft.addSubSection(section11.id, section111);
    productDataModelDraft.addSubSection(section11.id, section112);

    productDataModelDraft.addSection(section2);

    productDataModelDraft.deleteSection(section11.id);
    expect(section1.subSections).toEqual([section12.id]);
    productDataModelDraft.deleteSection(section1.id);

    expect(productDataModelDraft.sections).toEqual([section2]);
  });

  it('should fail to delete a section if it could not be found', () => {
    const productDataModelDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({ organizationId, userId }),
    );
    const section = SectionDraft.create({
      name: 'Technical specification',
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    productDataModelDraft.addSection(section);

    expect(() => productDataModelDraft.deleteSection('unknown-id')).toThrow(
      new ValueError('Could not found and delete section with id unknown-id'),
    );
  });

  it('should add field', () => {
    const productDataModelDraft = TemplateDraft.loadFromDb({
      ...templateDraftDbFactory.build(),
    });
    const dataField1 = DataFieldDraft.create({
      name: 'Processor',
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField2 = DataFieldDraft.create({
      name: 'Memory',
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });

    productDataModelDraft.addDataFieldToSection(
      sectionDraftEnvironment.id,
      dataField1,
    );
    productDataModelDraft.addDataFieldToSection(
      sectionDraftEnvironment.id,
      dataField2,
    );

    const existingFields = sectionDraftEnvironment.dataFields.map((d) =>
      DataFieldDraft.loadFromDb(d),
    );
    expect(
      productDataModelDraft.findSectionOrFail(sectionDraftEnvironment.id)
        .dataFields,
    ).toEqual([...existingFields, dataField1, dataField2]);

    expect(() =>
      productDataModelDraft.addDataFieldToSection(
        'not-found-section',
        dataField1,
      ),
    ).toThrow(new NotFoundError(SectionDraft.name, 'not-found-section'));
  });

  it('should delete data field', () => {
    const dataFieldProps1 = textFieldProps.build({ name: 'Processor' });
    const dataFieldProps2 = textFieldProps.build({ name: 'Memory' });
    const productDataModelDraft = TemplateDraft.loadFromDb(
      templateDraftDbFactory.build({
        sections: [
          sectionDraftDbPropsFactory
            .addDataField(dataFieldProps1)
            .addDataField(dataFieldProps2)
            .build({
              id: 'section-1',
              name: 'section-1',
            }),
          sectionDraftEnvironment,
        ],
      }),
    );

    productDataModelDraft.deleteDataFieldOfSection(
      'section-1',
      dataFieldProps1.id,
    );
    expect(
      productDataModelDraft.findSectionOrFail('section-1').dataFields,
    ).toEqual([DataFieldDraft.loadFromDb(dataFieldProps2)]);
  });
});
