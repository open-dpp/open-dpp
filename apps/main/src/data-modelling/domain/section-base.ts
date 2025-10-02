import type { GranularityLevel } from './granularity-level'

export enum SectionType {
  GROUP = 'Group',
  REPEATABLE = 'Repeatable',
}

export abstract class SectionBase {
  protected constructor(
    public readonly id: string,
    protected _name: string,
    public readonly type: SectionType,
    protected _subSections: string[],
    protected _parentId?: string,
    public granularityLevel?: GranularityLevel,
  ) {}

  public setGranularityLevel(level: GranularityLevel): void {
    this.granularityLevel = level
  }

  get name() {
    return this._name
  }

  get subSections() {
    return this._subSections
  }

  get parentId() {
    return this._parentId
  }
}
