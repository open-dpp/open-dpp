import { DataFieldDraft } from './data-field-draft';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { expect } from '@jest/globals';

describe('DataField', () => {
  it('is created', () => {
    const field = DataFieldDraft.create({
      name: 'Processor',
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },
      granularityLevel: GranularityLevel.MODEL,
    });
    expect(field.id).toBeDefined();
    expect(field.type).toEqual(DataFieldType.TEXT_FIELD);
    expect(field.options).toEqual({ max: 2 });
    expect(field.granularityLevel).toEqual(GranularityLevel.MODEL);
  });

  it('is renamed', () => {
    const field = DataFieldDraft.create({
      name: 'Processor',
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    field.rename('Memory');
    expect(field.name).toEqual('Memory');
  });

  it('overrides options', () => {
    const field = DataFieldDraft.create({
      name: 'Processor',
      type: DataFieldType.TEXT_FIELD,
      options: { min: 7, regex: '/d' },
      granularityLevel: GranularityLevel.MODEL,
    });
    field.mergeOptions({ max: 3, min: 9 });
    expect(field.options).toEqual({ min: 9, max: 3, regex: '/d' });
  });

  it('should publish data field draft', () => {
    const field = DataFieldDraft.create({
      name: 'Processor',
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },

      granularityLevel: GranularityLevel.MODEL,
    });

    const publishedField = field.publish();
    expect(publishedField).toEqual({
      type: DataFieldType.TEXT_FIELD,
      name: field.name,
      granularityLevel: field.granularityLevel,
      id: field.id,
      options: field.options,
    });
  });
});
