import {
  DataFieldBase,
  DataFieldType,
} from '../../data-modelling/domain/data-field-base';
import { merge } from 'lodash';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { randomUUID } from 'crypto';
import { DataFieldDbProps } from '../../templates/domain/data-field';

export type DataFieldDraftCreateProps = {
  name: string;
  type: DataFieldType;
  options?: Record<string, unknown>;
  granularityLevel: GranularityLevel;
};

export type DataFieldDraftDbProps = DataFieldDraftCreateProps & {
  id: string;
};

export class DataFieldDraft extends DataFieldBase {
  private constructor(
    public readonly id: string,
    protected _name: string,
    public readonly type: DataFieldType,
    public readonly options: Record<string, unknown> = {},
    public readonly granularityLevel: GranularityLevel,
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
