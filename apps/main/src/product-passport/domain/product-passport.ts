import type { Item } from "../../items/domain/item";
import type { Model } from "../../models/domain/model";
import type { DataValue } from "../../product-passport-data/domain/data-value";
import type { Template } from "../../templates/domain/template";
import type { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import { maxBy, minBy } from "lodash";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Section } from "../../templates/domain/section";

export class DataSection extends Section {
  section: Section;
  public readonly dataValues: { [key: string]: string }[];

  private constructor(
    section: Section,
    dataValues: { [key: string]: string }[],
  ) {
    super(
      section.id,
      section.name,
      section.type,
      section.subSections,
      section.parentId,
      section.granularityLevel,
      section.dataFields,
    );
    this.dataValues = dataValues;
  }

  static create(data: { section: Section; model: Model; item?: Item }) {
    const dataValues = DataSection.constructDataValues(
      data.section,
      data.model,
      data.item,
    );
    return new DataSection(data.section, dataValues);
  }

  private static constructDataValues(
    section: Section,
    model: Model,
    item?: Item,
  ) {
    let dataValuesOfSection: DataValue[];
    if (section.type === SectionType.REPEATABLE) {
      dataValuesOfSection
        = section.granularityLevel === GranularityLevel.MODEL
          ? model.getDataValuesBySectionId(section.id)
          : (item?.getDataValuesBySectionId(section.id) ?? []);
    }
    else {
      dataValuesOfSection = model
        .getDataValuesBySectionId(section.id)
        .concat(item?.getDataValuesBySectionId(section.id) ?? []);
    }

    const maxFound = maxBy(dataValuesOfSection, "row")?.row;

    const minRow = minBy(dataValuesOfSection, "row")?.row ?? 0;
    const maxRow = maxFound && Number.isFinite(maxFound) ? maxFound + 1 : 0;
    const dataValues: Array<any> = [];
    for (let rowIndex = minRow; rowIndex < maxRow; rowIndex++) {
      dataValues.push(
        this.processDataFields(
          section,
          dataValuesOfSection.filter(v => v.row === rowIndex),
          item,
        ),
      );
    }
    return dataValues;
  }

  private static processDataFields(
    section: Section,
    dataValuesOfSection: DataValue[],
    item?: Item,
  ) {
    const result = {};
    for (const dataField of section.dataFields) {
      const dataValue = dataValuesOfSection.find(
        v => v.dataFieldId === dataField.id,
      );
      // for model view: filter out data fields that are not in the model
      if (item || dataField.granularityLevel !== GranularityLevel.ITEM) {
        (result as any)[dataField.id] = dataValue?.value;
      }
    }
    return result;
  }
}

export class ProductPassport {
  public readonly id: string;
  public readonly name: string;
  public description: string;
  public readonly dataSections: DataSection[];

  private constructor(
    id: string,
    name: string,
    description: string,
    dataSections: DataSection[],
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.dataSections = dataSections;
  }

  static create(data: {
    template: Template;
    model: Model;
    item?: Item;
    uniqueProductIdentifier: UniqueProductIdentifier;
  }) {
    if (!data.model.description) {
      // throw new ValueError("Model does not have a description. Please add one.");
    }
    const dataSections = data.template.sections.map(section =>
      DataSection.create({ section, model: data.model, item: data.item }),
    );
    return new ProductPassport(
      data.uniqueProductIdentifier.uuid,
      data.model.name,
      data.model.description || "",
      dataSections,
    );
  }
}
