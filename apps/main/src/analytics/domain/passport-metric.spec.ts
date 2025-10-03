import { MeasurementType, PassportMetric } from './passport-metric';
import {
  dataFieldFactory,
  passportMetricCreateFactory,
  passportMetricFactory,
} from '../fixtures/passport-metric.factory';
import { randomUUID } from 'crypto';

describe('PassportMetric', () => {
  it('should be created', () => {
    const props = passportMetricCreateFactory.build();
    const passportMetric = PassportMetric.create(props);
    expect(passportMetric).toBeInstanceOf(PassportMetric);
    expect(passportMetric.source).toEqual(props.source);
    expect(passportMetric.id).toBeDefined();
    expect(passportMetric.date).toEqual(props.date);
    expect(passportMetric.values).toEqual([]);
  });

  it('should load from db', () => {
    const values = [
      { key: 'v1', row: 1, value: 1 },
      { key: 'v2', row: 2, value: 2 },
      { key: 'v3', row: 3, value: 3 },
    ];
    const props = passportMetricFactory.build({ values });
    const passportMetric = PassportMetric.loadFromDb(props);
    expect(passportMetric).toBeInstanceOf(PassportMetric);
    expect(passportMetric.source).toEqual(props.source);
    expect(passportMetric.id).toEqual(props.id);
    expect(passportMetric.date).toEqual(props.date);
    expect(passportMetric.values).toEqual(values);
  });

  it('create page view', () => {
    const modelId = randomUUID();
    const templateId = randomUUID();
    const organizationId = randomUUID();
    const page = 'http://example.com/page1';
    const date = new Date();
    const passportMetric = PassportMetric.createPageView({
      source: { modelId, templateId, organizationId },
      page,
      date,
    });
    expect(passportMetric).toBeInstanceOf(PassportMetric);

    expect(passportMetric.source.type).toEqual(MeasurementType.PAGE_VIEWS);
    expect(passportMetric.values).toEqual([
      { key: page, row: null, value: 1 },
      { key: 'http://example.com', row: null, value: 1 },
    ]);
  });

  it('create metric for numeric data fields', () => {
    const modelId = randomUUID();
    const templateId = randomUUID();
    const organizationId = randomUUID();
    const field1row0 = dataFieldFactory.build({ value: 3 });
    const field2 = dataFieldFactory.build({ value: 7 });
    const field1row1 = dataFieldFactory.build({
      ...field1row0,
      value: 9,
      row: 1,
    });
    const textFieldToIgnore = dataFieldFactory.build({
      value: 'text',
    });

    const dataFields = [field1row0, field2, field1row1, textFieldToIgnore];
    const date = new Date();
    const passportMetric = PassportMetric.createFieldAggregate({
      source: { modelId, templateId, organizationId },
      fieldValues: dataFields,
      date,
    });
    expect(passportMetric).toBeInstanceOf(PassportMetric);
    expect(passportMetric.source.type).toEqual(MeasurementType.FIELD_AGGREGATE);
    expect(passportMetric.values).toEqual([
      { key: field1row0.dataFieldId, row: 0, value: 3 },
      { key: field2.dataFieldId, row: 0, value: 7 },
      { key: field1row1.dataFieldId, row: 1, value: 9 },
    ]);
  });
});
