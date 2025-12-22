import type { DataFieldType_TYPE } from "../../data-modelling/domain/data-field-base";
import type { Item } from "../../items/domain/item";
import type { Model } from "../../models/domain/model";
import type {
  RepeaterSection,
  Section,
} from "../../old-templates/domain/section";
import type { Template } from "../../old-templates/domain/template";
import type { DataValue } from "../../product-passport-data/domain/data-value";
import _ from "lodash";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import {
  isGroupSection,
  isRepeaterSection,
} from "../../old-templates/domain/section";

export class View {
  private readonly template: Template;
  private readonly model: Model;
  private readonly item: Item | undefined;

  private constructor(
    template: Template,
    model: Model,
    item: Item | undefined,
  ) {
    this.template = template;
    this.model = model;
    this.item = item;
  }

  static create(data: { template: Template; model: Model; item?: Item }) {
    return new View(data.template, data.model, data.item);
  }

  build() {
    const nodes = [];
    const rootSections = this.template.sections.filter(
      s => s.parentId === undefined,
    );
    const rootSectionsFilteredByLevel = this.item
      ? rootSections // at the item level we show all root sections
      : rootSections.filter(
          s =>
            s.granularityLevel === GranularityLevel.MODEL
            || s.granularityLevel === undefined,
        );
    for (const section of rootSectionsFilteredByLevel) {
      if (isRepeaterSection(section)) {
        nodes.push(this.processRepeaterSection(section));
      }
      else if (isGroupSection(section)) {
        nodes.push(this.processSection(section));
      }
    }
    return {
      name: this.model.name,
      description: this.model.description,
      nodes,
    };
  }

  processRepeaterSection(section: RepeaterSection) {
    const dataValuesOfSectionAllRows
      = section.granularityLevel === GranularityLevel.MODEL
        ? this.model.getDataValuesBySectionId(section.id)
        : (this.item?.getDataValuesBySectionId(section.id) ?? []);
    const minRow = _.minBy(dataValuesOfSectionAllRows, "row")?.row ?? 0;
    const maxRow = _.maxBy(dataValuesOfSectionAllRows, "row")?.row ?? 0;

    const rows = [];
    for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
      rows.push(this.processSection(section, rowIndex));
    }
    return {
      name: section.name,
      rows,
    };
  }

  processSection(section: Section, rowIndex?: number) {
    let dataValuesOfSection: DataValue[];
    if (section.type === SectionType.REPEATABLE) {
      dataValuesOfSection
        = section.granularityLevel === GranularityLevel.MODEL
          ? this.model.getDataValuesBySectionId(section.id, rowIndex)
          : (this.item?.getDataValuesBySectionId(section.id, rowIndex) ?? []);
    }
    else {
      dataValuesOfSection = this.model
        .getDataValuesBySectionId(section.id, rowIndex)
        .concat(
          this.item?.getDataValuesBySectionId(section.id, rowIndex) ?? [],
        );
    }

    const children = this.processDataFields(section, dataValuesOfSection);
    for (const subSectionId of section.subSections) {
      const subSection = this.template.findSectionByIdOrFail(subSectionId);
      // @ts-expect-error uses mongo id
      children.push(this.processSection(subSection, rowIndex));
    }

    return {
      name: isGroupSection(section) ? section.name : undefined,
      children,
    };
  }

  processDataFields(section: Section, dataValuesOfSection: DataValue[]) {
    const result: Array<{
      type: DataFieldType_TYPE;
      name: string;
      value: unknown;
    }> = [];
    for (const dataField of section.dataFields) {
      const dataValue = dataValuesOfSection.find(
        v => v.dataFieldId === dataField.id,
      );
      // for model view: filter out data fields that are not in the model
      if (this.item || dataField.granularityLevel !== GranularityLevel.ITEM) {
        result.push({
          type: dataField.type,
          name: dataField.name,
          value: dataValue?.value,
        });
      }
    }
    return result;
  }
}
