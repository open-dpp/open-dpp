import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import {
  TemplateDraftCreateProps,
  TemplateDraftDbProps,
} from '../domain/template-draft';
import { CreateTemplateDraftDto } from '../presentation/dto/create-template-draft.dto';
import { sectionDraftDbPropsFactory } from './section-draft.factory';
import { SectionType } from '../../data-modelling/domain/section-base';
import { textFieldProps } from './data-field-draft.factory';

import { Sector } from '../../data-modelling/domain/sectors';

export const templateDraftCreatePropsFactory =
  Factory.define<TemplateDraftCreateProps>(() => ({
    name: 'Laptop',
    description: 'My Laptop',
    sectors: [Sector.ELECTRONICS],
    organizationId: randomUUID(),
    userId: randomUUID(),
  }));

export const templateDraftCreateDtoFactory =
  Factory.define<CreateTemplateDraftDto>(() => ({
    name: 'Laptop',
    description: 'My Laptop',
    sectors: [Sector.ELECTRONICS],
  }));

export const sectionDraftEnvironment = sectionDraftDbPropsFactory
  .addDataField(textFieldProps.build({ name: 'Title 1' }))
  .addDataField(
    textFieldProps.build({
      name: 'Title 2',
    }),
  )
  .build({
    id: 'environment',
    type: SectionType.GROUP,
    name: 'Umwelt',
  });

const sectionDraftMaterial = sectionDraftDbPropsFactory
  .addDataField(textFieldProps.build({ name: 'Material Title 1' }))
  .addDataField(
    textFieldProps.build({
      name: 'Material Title 2',
    }),
  )
  .build({
    id: 'm1',
    subSections: ['meas1'],
    type: SectionType.REPEATABLE,
    name: 'Material',
  });

const sectionDraftMeasurement = sectionDraftDbPropsFactory
  .addDataField(textFieldProps.build({ name: 'Measurement Title 1' }))
  .addDataField(
    textFieldProps.build({
      name: 'Measurement Title 2',
    }),
  )
  .build({
    id: 'meas1',
    parentId: 'm1',
    type: SectionType.GROUP,
    name: 'Measurement',
  });

export const templateDraftDbFactory = Factory.define<TemplateDraftDbProps>(
  () => ({
    id: randomUUID(),
    description: 'My description',
    sectors: [Sector.ELECTRONICS],
    publications: [],
    name: 'Laptop',
    version: '1.0.0',
    organizationId: randomUUID(),
    userId: randomUUID(),
    sections: [
      sectionDraftEnvironment,
      sectionDraftMaterial,
      sectionDraftMeasurement,
    ],
  }),
);
