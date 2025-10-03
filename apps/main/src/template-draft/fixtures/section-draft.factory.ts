import type { BuildOptions, DeepPartialObject } from "fishery";
import type { DataFieldDraftDbProps } from "../domain/data-field-draft";
import type { SectionDraftDbProps } from "../domain/section-draft";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";

export class SectionDraftFactory extends Factory<SectionDraftDbProps> {
  private _dataFields: DataFieldDraftDbProps[] = [];

  addDataField(dataField: DataFieldDraftDbProps) {
    this._dataFields.push(dataField);
    return this;
  }

  override build(
    params?: DeepPartialObject<SectionDraftDbProps>,

    options?: BuildOptions<SectionDraftDbProps, any>,
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
