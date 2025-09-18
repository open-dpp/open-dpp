import { randomUUID } from 'crypto';
import { DataFieldDraft } from './data-field-draft';
import { SectionDraft, SectionDraftDbProps } from './section-draft';
import { Template } from '../../templates/domain/template';
import * as semver from 'semver';
import { SectionType } from '../../data-modelling/domain/section-base';
import { Sector } from '@open-dpp/api-client';
import { NotFoundError, ValueError } from '@app/exception/domain.errors';

export type Publication = {
  id: string;
  version: string;
};

export enum MoveDirection {
  UP = 'up',
  DOWN = 'down',
}

export type TemplateDraftCreateProps = {
  name: string;
  sectors: Sector[];
  description: string;
  userId: string;
  organizationId: string;
};

export type TemplateDraftDbProps = TemplateDraftCreateProps & {
  id: string;
  version: string;
  publications: Publication[];
  sections: SectionDraftDbProps[];
};

export class TemplateDraft {
  private constructor(
    public readonly id: string,
    private _name: string,
    public readonly description: string,
    public readonly sectors: Sector[],
    public readonly version: string,
    private readonly _publications: Publication[],
    private _ownedByOrganizationId: string | undefined,
    private _createdByUserId: string | undefined,
    private _sections: SectionDraft[],
  ) {}

  static create(data: {
    name: string;
    description: string;
    sectors: Sector[];
    userId: string;
    organizationId: string;
  }) {
    return new TemplateDraft(
      randomUUID(),
      data.name,
      data.description,
      data.sectors,
      '1.0.0',
      [],
      data.organizationId,
      data.userId,
      [],
    );
  }

  get sections() {
    return this._sections;
  }

  public isOwnedBy(organizationId: string) {
    return this._ownedByOrganizationId === organizationId;
  }

  get name() {
    return this._name;
  }

  public get createdByUserId() {
    return this._createdByUserId;
  }

  public get publications() {
    return this._publications;
  }

  public get ownedByOrganizationId() {
    return this._ownedByOrganizationId;
  }

  static loadFromDb(data: TemplateDraftDbProps): TemplateDraft {
    return new TemplateDraft(
      data.id,
      data.name,
      data.description,
      data.sectors,
      data.version,
      data.publications,
      data.organizationId,
      data.userId,
      data.sections.map((s) => SectionDraft.loadFromDb(s)),
    );
  }

  rename(newName: string) {
    this._name = newName;
  }

  deleteSection(sectionId: string) {
    const { section, parent } = this.findSectionWithParent(sectionId);
    if (!section) {
      throw new ValueError(
        `Could not found and delete section with id ${sectionId}`,
      );
    }
    if (parent) {
      parent.deleteSubSection(section);
    }
    for (const childSectionId of section.subSections) {
      this.deleteSection(childSectionId);
    }
    this._sections = this.sections.filter((s) => s.id !== section.id);
  }

  modifySection(sectionId: string, data: { name?: string }) {
    const section = this.findSectionOrFail(sectionId);
    if (data.name) {
      section.rename(data.name);
    }
  }

  modifyDataField(
    sectionId: string,
    dataFieldId: string,
    data: {
      name?: string;
      options?: Record<string, unknown>;
    },
  ) {
    this.findSectionOrFail(sectionId).modifyDataField(dataFieldId, data);
  }

  addDataFieldToSection(sectionId: string, dataField: DataFieldDraft) {
    this.findSectionOrFail(sectionId).addDataField(dataField);
  }

  deleteDataFieldOfSection(sectionId: string, dataFieldId: string) {
    this.findSectionOrFail(sectionId).deleteDataField(dataFieldId);
  }

  findSectionOrFail(sectionId: string) {
    const { section } = this.findSectionWithParent(sectionId);
    if (!section) {
      throw new NotFoundError(SectionDraft.name, sectionId);
    }
    return section;
  }

  public moveDataField(
    sectionId: string,
    dataFieldId: string,
    direction: MoveDirection,
  ) {
    this.findSectionOrFail(sectionId).moveDataField(dataFieldId, direction);
  }

  public moveSection(sectionId: string, direction: MoveDirection) {
    const section = this.findSectionOrFail(sectionId);
    const siblingSections = this.findSectionsOfParent(section.parentId);
    const siblingIndex = siblingSections.findIndex((s) => s.id === sectionId);
    const shiftIndex = direction === MoveDirection.UP ? -1 : 1;
    const newSiblingIndex = siblingIndex + shiftIndex;

    // Bounds checking for sibling position
    if (newSiblingIndex < 0 || newSiblingIndex >= siblingSections.length) {
      return; // Can't move beyond bounds
    }

    // Get the target sibling
    const targetSibling = siblingSections[newSiblingIndex];

    // Find global indices
    const fromIndex = this._sections.findIndex((s) => s.id === sectionId);
    const toIndex = this._sections.findIndex((s) => s.id === targetSibling.id);

    // Remove and reinsert
    const [removed] = this._sections.splice(fromIndex, 1);
    this._sections.splice(toIndex, 0, removed);
  }

  findSectionWithParent(sectionId: string) {
    const section = this.sections.find((s) => s.id === sectionId);
    const parent = section?.parentId
      ? this.sections.find((s) => s.id === section.parentId)
      : undefined;
    return { section, parent };
  }

  findSectionsOfParent(parentSectionId?: string) {
    return this.sections.filter((s) => s.parentId === parentSectionId);
  }

  addSubSection(parentSectionId: string, section: SectionDraft) {
    const parentSection = this.findSectionOrFail(parentSectionId);
    if (
      section.granularityLevel &&
      parentSection.granularityLevel &&
      section.granularityLevel !== parentSection.granularityLevel
    ) {
      throw new ValueError(
        `Sub section ${section.id} has a granularity level of ${section.granularityLevel} which does not match the parent section's  granularity level of ${parentSection.granularityLevel}`,
      );
    }
    if (!section.granularityLevel && parentSection.granularityLevel) {
      section.setGranularityLevel(parentSection.granularityLevel);
    }

    parentSection.addSubSection(section);
    this.sections.push(section);
  }

  addSection(section: SectionDraft) {
    if (section.parentId && section.type === SectionType.REPEATABLE) {
      throw new ValueError(
        `Repeater section can only be added as root section`,
      );
    }
    this.sections.push(section);
  }

  publish(createdByUserId: string): Template {
    if (!this.ownedByOrganizationId) {
      throw new ValueError(`Template must belong to an organization`);
    }
    const lastPublished = this.publications.slice(-1);

    const versionToPublish =
      lastPublished.length > 0
        ? semver.inc(lastPublished[0].version, 'major')
        : '1.0.0';

    const published = Template.loadFromDb({
      id: randomUUID(),
      marketplaceResourceId: null,
      name: this.name,
      description: this.description,
      sectors: this.sectors,
      version: versionToPublish,
      userId: createdByUserId,
      organizationId: this.ownedByOrganizationId,
      sections: this.sections.map((s) => s.publish()),
    });
    this.publications.push({ id: published.id, version: published.version });
    return published;
  }
}
