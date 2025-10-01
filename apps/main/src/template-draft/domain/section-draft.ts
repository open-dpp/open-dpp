import { DataFieldDraft, DataFieldDraftDbProps } from './data-field-draft';
import {
  SectionBase,
  SectionType,
} from '../../data-modelling/domain/section-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { randomUUID } from 'crypto';
import { SectionDbProps } from '../../templates/domain/section';
import { MoveDirection } from './template-draft';
import { NotFoundError, ValueError } from '@open-dpp/exception';

export type SectionDraftCreateProps = {
  name: string;
  type: SectionType;
  granularityLevel?: GranularityLevel;
};

export type SectionDraftDbProps = SectionDraftCreateProps & {
  id: string;
  subSections: string[];
  parentId: string | undefined;
  dataFields: DataFieldDraftDbProps[];
};

export class SectionDraft extends SectionBase {
  private constructor(
    public readonly id: string,
    protected _name: string,
    public readonly type: SectionType,
    protected _subSections: string[],
    protected _parentId: string | undefined,
    public granularityLevel: GranularityLevel | undefined,
    public readonly dataFields: DataFieldDraft[],
  ) {
    super(id, _name, type, _subSections, _parentId, granularityLevel);
  }

  static create(data: SectionDraftCreateProps) {
    if (data.type === SectionType.REPEATABLE && !data.granularityLevel) {
      throw new ValueError(`Repeatable must have a granularity level`);
    }
    return new SectionDraft(
      randomUUID(),
      data.name,
      data.type,
      [],
      undefined,
      data.granularityLevel,
      [],
    );
  }

  static loadFromDb(data: SectionDraftDbProps): SectionDraft {
    return new SectionDraft(
      data.id,
      data.name,
      data.type,
      data.subSections,
      data.parentId,
      data.granularityLevel,
      data.dataFields.map((d) => DataFieldDraft.loadFromDb(d)),
    );
  }

  assignParent(parent: SectionDraft) {
    this._parentId = parent.id;
  }

  removeParent() {
    this._parentId = undefined;
  }

  rename(newName: string) {
    this._name = newName;
  }

  addDataField(dataField: DataFieldDraft) {
    if (
      this.granularityLevel &&
      this.granularityLevel !== dataField.granularityLevel
    ) {
      throw new ValueError(
        `Data field ${dataField.id} has a granularity level of ${dataField.granularityLevel} which does not match the section's granularity level of ${this.granularityLevel}`,
      );
    }
    this.dataFields.push(dataField);
  }

  addSubSection(section: SectionDraft) {
    this._subSections.push(section.id);
    section.assignParent(this);
  }

  deleteSubSection(subSection: SectionDraft) {
    if (!this.subSections.find((id) => id === subSection.id)) {
      throw new ValueError(
        `Could not found and delete sub section ${subSection.id} from ${this.id}`,
      );
    }
    this._subSections = this.subSections.filter((n) => n !== subSection.id);
    subSection.removeParent();
    return subSection;
  }

  modifyDataField(
    dataFieldId: string,
    data: {
      name?: string;
      options?: Record<string, unknown>;
    },
  ) {
    const found = this.dataFields.find((d) => d.id === dataFieldId);
    if (!found) {
      throw new NotFoundError(DataFieldDraft.name, dataFieldId);
    }
    if (data.name) {
      found.rename(data.name);
    }
    if (data.options) {
      found.mergeOptions(data.options);
    }
  }

  moveDataField(dataFieldId: string, direction: MoveDirection) {
    const fromIndex = this.dataFields.findIndex((d) => d.id === dataFieldId);
    if (fromIndex < 0) {
      throw new NotFoundError(DataFieldDraft.name, dataFieldId);
    }
    const shiftIndex = direction === MoveDirection.UP ? -1 : 1;

    const toIndex = fromIndex + shiftIndex;
    if (toIndex < 0 || toIndex >= this.dataFields.length) {
      return;
    }

    const deletedField = this.dataFields.splice(fromIndex, 1);
    this.dataFields.splice(toIndex, 0, deletedField[0]);
  }

  deleteDataField(dataFieldId: string) {
    const foundIndex = this.dataFields.findIndex((d) => d.id === dataFieldId);
    if (foundIndex < 0) {
      throw new NotFoundError(DataFieldDraft.name, dataFieldId);
    }
    this.dataFields.splice(foundIndex, 1);
  }

  publish(): SectionDbProps {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      parentId: this.parentId,
      subSections: this.subSections,
      dataFields: this.dataFields.map((d) => d.publish()),
      granularityLevel: this.granularityLevel,
    };
  }
}
