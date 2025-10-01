import {
  DataField,
  DataFieldDbProps,
  DataFieldValidationResult,
  findDataFieldClassByTypeOrFail,
} from './data-field';
import { groupBy } from 'lodash';
import {
  SectionBase,
  SectionType,
} from '../../data-modelling/domain/section-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { randomUUID } from 'crypto';
import { NotSupportedError } from '@open-dpp/exception';

type SectionProps = {
  name: string;
  granularityLevel?: GranularityLevel; // Required for repeater sections
};

export type SectionDbProps = SectionProps & {
  id: string;
  type: SectionType;
  parentId: string | undefined;
  subSections: string[];
  dataFields: DataFieldDbProps[];
};

export abstract class Section extends SectionBase {
  public constructor(
    public readonly id: string,
    protected _name: string,
    public readonly type: SectionType,
    protected _subSections: string[],
    protected _parentId: string | undefined,
    public granularityLevel: GranularityLevel | undefined,
    public readonly dataFields: DataField[],
  ) {
    super(id, _name, type, _subSections, _parentId, granularityLevel);
  }

  protected static createInstance<T extends Section>(
    Ctor: new (...args: any[]) => T,
    data: SectionProps,
    type: SectionType,
  ): T {
    return new Ctor(
      randomUUID(),
      data.name,
      type,
      [],
      undefined,
      data.granularityLevel,
      [],
    );
  }

  // Add static factory method for loadFromDb
  protected static loadFromDbInstance<T extends Section>(
    Ctor: new (...args: any[]) => T,
    data: SectionDbProps,
    type: SectionType,
  ): T {
    return new Ctor(
      data.id,
      data.name,
      type,
      data.subSections,
      data.parentId,
      data.granularityLevel,
      data.dataFields.map((d) => {
        const DataFieldClass = findDataFieldClassByTypeOrFail(d.type);
        return DataFieldClass.loadFromDb(d);
      }),
    );
  }

  validate(
    version: string,
    values: DataValue[],
    granularity: GranularityLevel,
  ): DataFieldValidationResult[] {
    const validations: Array<DataFieldValidationResult> = [];
    const sectionValues = groupBy(
      values.filter((v) => v.dataSectionId === this.id),
      'row',
    );
    for (const [row, dataValuesOfRow] of Object.entries(sectionValues)) {
      for (const dataField of this.dataFields.filter(
        (d) => d.granularityLevel === granularity,
      )) {
        const dataValue = dataValuesOfRow.find(
          (v) => v.dataFieldId === dataField.id,
        );
        validations.push(
          dataValue
            ? dataField.validate(version, dataValue.value)
            : DataFieldValidationResult.create({
                dataFieldId: dataField.id,
                dataFieldName: dataField.name,
                isValid: false,
                row: Number(row),
                errorMessage: `Value for data field is missing`,
              }),
        );
      }
    }
    return validations;
  }

  toDbProps(): SectionDbProps {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      subSections: this._subSections,
      parentId: this._parentId,
      granularityLevel: this.granularityLevel,
      dataFields: this.dataFields.map((d) => d.toDbProps()),
    };
  }
}

export class RepeaterSection extends Section {
  static create(data: SectionProps) {
    return Section.createInstance(
      RepeaterSection,
      data,
      SectionType.REPEATABLE,
    );
  }

  static loadFromDb(data: SectionDbProps) {
    return Section.loadFromDbInstance(
      RepeaterSection,
      data,
      SectionType.REPEATABLE,
    );
  }
}

export class GroupSection extends Section {
  static create(data: SectionProps) {
    return Section.createInstance(GroupSection, data, SectionType.GROUP);
  }

  static loadFromDb(data: SectionDbProps) {
    return Section.loadFromDbInstance(GroupSection, data, SectionType.GROUP);
  }
}

const sectionSubTypes = [
  { value: RepeaterSection, name: SectionType.REPEATABLE },
  { value: GroupSection, name: SectionType.GROUP },
];

export function findSectionClassByTypeOrFail(type: SectionType) {
  const foundSectionType = sectionSubTypes.find((st) => st.name === type);
  if (!foundSectionType) {
    throw new NotSupportedError(`Section type ${type} is not supported`);
  }
  return foundSectionType.value;
}

export function isGroupSection(section: Section): section is GroupSection {
  return section.type === SectionType.GROUP;
}

export function isRepeaterSection(
  section: Section,
): section is RepeaterSection {
  return section.type === SectionType.REPEATABLE;
}
