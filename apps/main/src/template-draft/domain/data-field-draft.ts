import type {
  DataFieldType_TYPE,
} from "../../data-modelling/domain/data-field-base";
import type { GranularityLevel_TYPE } from "../../data-modelling/domain/granularity-level";
import type { DataFieldDbProps } from "../../templates/domain/data-field";
import { randomUUID } from "node:crypto";
import { merge } from "lodash";
import {
  DataFieldBase,
} from "../../data-modelling/domain/data-field-base";

export interface DataFieldDraftCreateProps {
  name: string;
  type: DataFieldType_TYPE;
  options?: Record<string, unknown>;
  granularityLevel: GranularityLevel_TYPE;
}

export type DataFieldDraftDbProps = DataFieldDraftCreateProps & {
  id: string;
};

export class DataFieldDraft extends DataFieldBase {
  private constructor(
    id: string,
    _name: string,
    type: DataFieldType_TYPE,
    options: Record<string, unknown> = {},
    granularityLevel: GranularityLevel_TYPE,
  ) {
    super(id, _name, type, options, granularityLevel);
  }

  static create(data: DataFieldDraftCreateProps): DataFieldDraft {
    return new DataFieldDraft(
      randomUUID(),
      data.name,
      data.type,
      data.options,
      data.granularityLevel,
    );
  }

  static loadFromDb(data: DataFieldDraftDbProps) {
    return new DataFieldDraft(
      data.id,
      data.name,
      data.type,
      data.options,
      data.granularityLevel,
    );
  }

  mergeOptions(newOptions: Record<string, unknown>) {
    merge(this.options, newOptions);
  }

  rename(newName: string) {
    this._name = newName;
  }

  changeType(dataFieldType: DataFieldType_TYPE) {
    this._type = dataFieldType;
    this._options = {};
  }

  publish(): DataFieldDbProps {
    return {
      type: this.type,
      id: this.id,
      granularityLevel: this.granularityLevel,
      options: this.options,
      name: this.name,
    };
  }
}
