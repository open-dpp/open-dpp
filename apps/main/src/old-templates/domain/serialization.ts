import type {
  DataFieldDoc,
  SectionDoc,
} from "../../data-modelling/infrastructure/template-base.schema";
import type {
  OldTemplateDoc,
} from "../infrastructure/template.schema";
import type { DataFieldDbProps } from "./data-field";
import type { SectionDbProps } from "./section";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import {
  TemplateDocSchemaVersion,
} from "../infrastructure/template.schema";
import { Template } from "./template";

export function serializeTemplate(t: Template) {
  return {
    _id: t.id,
    name: t.name,
    description: t.description,
    sectors: t.sectors,
    version: t.version,
    _schemaVersion: TemplateDocSchemaVersion.v1_0_3,
    sections: t.sections.map(s => ({
      _id: s.id,
      name: s.name,
      type: s.type,
      granularityLevel: s.granularityLevel,
      dataFields: s.dataFields.map(d => ({
        _id: d.id,
        name: d.name,
        type: d.type,
        options: d.options,
        granularityLevel: d.granularityLevel,
      })),
      subSections: s.subSections,
      parentId: s.parentId,
    })),
    createdByUserId: t.createdByUserId,
    ownedByOrganizationId: t.ownedByOrganizationId,
    marketplaceResourceId: t.marketplaceResourceId,
  };
}

export function deserializeTemplate(plain: OldTemplateDoc) {
  const tmp = {
    id: plain._id,
    marketplaceResourceId: plain.marketplaceResourceId,
    name: plain.name,
    description: plain.description,
    sectors: plain.sectors,
    version: plain.version,
    userId: plain.createdByUserId,
    organizationId: plain.ownedByOrganizationId,
    sections: plain.sections.map((s: SectionDoc) => createSection(s)),
  };
  return Template.loadFromDb(tmp);
}

function createSection(sectionDoc: SectionDoc): SectionDbProps {
  return {
    id: sectionDoc._id,
    type: sectionDoc.type,
    name: sectionDoc.name,
    parentId: sectionDoc.parentId,
    subSections: sectionDoc.subSections,
    dataFields: sectionDoc.dataFields.map(df => createDataField(df)),
    granularityLevel: sectionDoc.granularityLevel
      ? sectionDoc.granularityLevel
      : sectionDoc.type === SectionType.REPEATABLE
        ? GranularityLevel.MODEL
        : undefined,
  };
}

function createDataField(dataFieldDoc: DataFieldDoc): DataFieldDbProps {
  return {
    id: dataFieldDoc._id,
    type: dataFieldDoc.type,
    granularityLevel: dataFieldDoc.granularityLevel,
    options: dataFieldDoc.options,
    name: dataFieldDoc.name,
  };
}
