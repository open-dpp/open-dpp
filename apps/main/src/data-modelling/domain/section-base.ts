import type { GranularityLevel_TYPE } from "./granularity-level";

export const SectionType = {
  GROUP: "Group",
  REPEATABLE: "Repeatable",
} as const;

export type SectionType_TYPE = (typeof SectionType)[keyof typeof SectionType];

export abstract class SectionBase {
  public readonly id: string;
  protected _name: string;
  public readonly type: SectionType_TYPE;
  protected _subSections: string[];
  protected _parentId?: string;
  public granularityLevel?: GranularityLevel_TYPE;

  protected constructor(
    id: string,
    _name: string,
    type: SectionType_TYPE,
    _subSections: string[],
    _parentId?: string,
    granularityLevel?: GranularityLevel_TYPE,
  ) {
    this.id = id;
    this._name = _name;
    this.type = type;
    this._subSections = _subSections;
    this._parentId = _parentId;
    this.granularityLevel = granularityLevel;
  }

  public setGranularityLevel(level: GranularityLevel_TYPE): void {
    this.granularityLevel = level;
  }

  get name() {
    return this._name;
  }

  get subSections() {
    return this._subSections;
  }

  get parentId() {
    return this._parentId;
  }
}
