import { BuildOptions, DeepPartialObject, Factory } from 'fishery';
import { SectionDraftDbProps } from '../domain/section-draft';
import { randomUUID } from 'crypto';
import { SectionType } from '../../data-modelling/domain/section-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { DataFieldDraftDbProps } from '../domain/data-field-draft';

export class SectionDraftFactory extends Factory<SectionDraftDbProps> {
  private _dataFields: DataFieldDraftDbProps[] = [];

  addDataField(dataField: DataFieldDraftDbProps) {
    this._dataFields.push(dataField);
    return this;
  }
  override build(
    params?: DeepPartialObject<SectionDraftDbProps> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: BuildOptions<SectionDraftDbProps, any> | undefined,
  ) {
    const result: SectionDraftDbProps = super.build(
      {
        ...params,
        dataFields: this._dataFields,
      },
      options,
    );
    this._dataFields = [];
    return result;
  }
}

export const sectionDraftDbPropsFactory = SectionDraftFactory.define(
  ({ params }) => {
    const id = params.id ?? randomUUID();
    return {
      id,
      parentId: undefined,
      type: SectionType.GROUP,
      name: `Section ${id}`,
      dataFields: [],
      subSections: [],
      granularityLevel: GranularityLevel.MODEL,
    };
  },
);
