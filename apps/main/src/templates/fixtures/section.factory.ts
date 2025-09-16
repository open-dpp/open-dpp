import { Factory } from 'fishery';
import { randomUUID } from 'crypto';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { SectionDbProps } from '../domain/section';
import { SectionType } from '../../data-modelling/domain/section-base';

export const sectionDbPropsFactory = Factory.define<SectionDbProps>(() => ({
  id: randomUUID(),
  type: SectionType.GROUP,
  parentId: undefined,
  name: 'Section',
  granularityLevel: GranularityLevel.MODEL,
  dataFields: [],
  subSections: [],
}));
