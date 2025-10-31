import { expect } from "@jest/globals";
import { NotFoundError, ValueError } from "@open-dpp/exception";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { dataFieldDraftDbPropsFactory } from "../fixtures/data-field-draft.factory";
import { sectionDraftDbPropsFactory } from "../fixtures/section-draft.factory";
import { DataFieldDraft } from "./data-field-draft";
import { SectionDraft } from "./section-draft";
import { MoveDirection } from "./template-draft";

describe("dataSectionDraft", () => {
  it("is created", () => {
    const section1 = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const section2 = SectionDraft.create({
      name: "Material",
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    expect(section1.id).toBeDefined();
    expect(section1.type).toEqual(SectionType.GROUP);
    expect(section1.dataFields).toEqual([]);
    expect(section1.parentId).toBeUndefined();
    expect(section1.granularityLevel).toEqual(GranularityLevel.MODEL);
    expect(section1.subSections).toEqual([]);
    expect(section2.id).toBeDefined();
    expect(section2.type).toEqual(SectionType.REPEATABLE);
    expect(section2.granularityLevel).toEqual(GranularityLevel.MODEL);
  });

  it("fails on creation if no granularity level is set for repeater section", () => {
    expect(() =>
      SectionDraft.create({
        name: "Material",
        type: SectionType.REPEATABLE,
      }),
    ).toThrow(new ValueError("Repeatable must have a granularity level"));
  });

  it("is renamed", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.rename("Tracebility");
    expect(section.name).toEqual("Tracebility");
  });

  it("should add data field", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField2 = DataFieldDraft.create({
      name: "Memory",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);
    section.addDataField(dataField2);
    expect(section.dataFields).toEqual([dataField1, dataField2]);
  });

  it("fails to add data field if granularity level of section and data field do not match", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField = DataFieldDraft.create({
      name: "Memory",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.ITEM,
    });
    expect(() => section.addDataField(dataField)).toThrow(
      new ValueError(
        `Data field ${dataField.id} has a granularity level of ${dataField.granularityLevel} which does not match the section's granularity level of ${section.granularityLevel}`,
      ),
    );
  });

  it("should modify data field", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField2 = DataFieldDraft.create({
      name: "Memory",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);
    section.addDataField(dataField2);
    section.modifyDataField(dataField1.id, {
      name: "newName",
      options: { min: 3 },
    });
    section.modifyDataField(dataField2.id, {
      type: DataFieldType.NUMERIC_FIELD,
      options: { max: 2 },
    });
    expect(section.dataFields).toEqual([
      DataFieldDraft.loadFromDb({
        id: dataField1.id,
        type: dataField1.type,
        granularityLevel: dataField1.granularityLevel,
        name: "newName",
        options: { min: 3, max: 2 },
      }),
      DataFieldDraft.loadFromDb({
        id: dataField2.id,
        type: DataFieldType.NUMERIC_FIELD,
        granularityLevel: dataField2.granularityLevel,
        name: dataField2.name,
        options: { max: 2 },
      }),
    ]);
  });

  it("should modify data field fails if not found", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);
    expect(() =>
      section.modifyDataField("unknown-id", {
        name: "newName",
        options: { min: 3 },
      }),
    ).toThrow(new NotFoundError(DataFieldDraft.name, "unknown-id"));
  });

  it("should move data field", () => {
    const dataField1 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build({ id: "f1" }),
    );
    const dataField2 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build({ id: "f2" }),
    );
    const dataField3 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build({ id: "f3" }),
    );
    const dataField4 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build({ id: "f4" }),
    );
    const section = SectionDraft.loadFromDb(
      sectionDraftDbPropsFactory
        .addDataField(dataField1)
        .addDataField(dataField2)
        .addDataField(dataField3)
        .addDataField(dataField4)
        .build(),
    );
    section.moveDataField(dataField2.id, MoveDirection.DOWN);
    expect(section.dataFields).toEqual([
      dataField1,
      dataField3,
      dataField2,
      dataField4,
    ]);
    section.moveDataField(dataField4.id, MoveDirection.UP);
    expect(section.dataFields).toEqual([
      dataField1,
      dataField3,
      dataField4,
      dataField2,
    ]);
    section.moveDataField(dataField4.id, MoveDirection.UP);
    expect(section.dataFields).toEqual([
      dataField1,
      dataField4,
      dataField3,
      dataField2,
    ]);
    section.moveDataField(dataField1.id, MoveDirection.UP);
    section.moveDataField(dataField2.id, MoveDirection.DOWN);
    expect(section.dataFields).toEqual([
      dataField1,
      dataField4,
      dataField3,
      dataField2,
    ]);
  });

  it("should delete data field", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField2 = DataFieldDraft.create({
      name: "Memory",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField3 = DataFieldDraft.create({
      name: "Storage",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);
    section.addDataField(dataField2);
    section.addDataField(dataField3);
    section.deleteDataField(dataField2.id);
    expect(section.dataFields).toEqual([dataField1, dataField3]);
  });

  it("should fail to delete data field if id not exists", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);

    expect(() => section.deleteDataField("no-id")).toThrow(
      new NotFoundError(DataFieldDraft.name, "no-id"),
    );
  });

  it("should add child section", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const childSection1 = SectionDraft.create({
      name: "Sub specification 1",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const childSection2 = SectionDraft.create({
      name: "Sub specification 2",
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addSubSection(childSection1);
    section.addSubSection(childSection2);
    expect(section.subSections).toEqual([childSection1.id, childSection2.id]);
    expect(childSection1.parentId).toEqual(section.id);
    expect(childSection2.parentId).toEqual(section.id);
  });

  it("should delete sub section", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const childSection1 = SectionDraft.create({
      name: "Sub specification 1",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const childSection2 = SectionDraft.create({
      name: "Sub specification 2",
      type: SectionType.REPEATABLE,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addSubSection(childSection1);
    section.addSubSection(childSection2);
    const result = section.deleteSubSection(childSection1);
    expect(section.subSections).toEqual([childSection2.id]);
    expect(result.parentId).toBeUndefined();

    // errors
    expect(() => section.deleteSubSection(childSection1)).toThrow(
      new ValueError(
        `Could not found and delete sub section ${childSection1.id} from ${section.id}`,
      ),
    );
  });

  it("should publish section draft", () => {
    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    const subSection = SectionDraft.create({
      name: "Dimensions",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addSubSection(subSection);
    const dataField1 = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { max: 2 },
      granularityLevel: GranularityLevel.MODEL,
    });
    section.addDataField(dataField1);
    const publishedSection = section.publish();
    expect(publishedSection).toEqual({
      id: section.id,
      type: SectionType.GROUP,
      parentId: undefined,
      name: "Technical specification",
      dataFields: [dataField1.publish()],
      subSections: [subSection.id],
      granularityLevel: GranularityLevel.MODEL,
    });

    const publishedSubSection = subSection.publish();
    expect(publishedSubSection).toEqual({
      id: subSection.id,
      type: SectionType.GROUP,
      name: "Dimensions",
      dataFields: [],
      subSections: [],
      parentId: section.id,
      granularityLevel: GranularityLevel.MODEL,
    });
  });
});
