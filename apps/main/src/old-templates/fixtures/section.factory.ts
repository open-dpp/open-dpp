import type { SectionDbProps } from "../domain/section";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";

export const sectionDbPropsFactory = Factory.define<SectionDbProps>(() => ({
  id: randomUUID(),
  type: SectionType.GROUP,
  parentId: undefined,
  name: "Section",
  granularityLevel: GranularityLevel.MODEL,
  dataFields: [],
  subSections: [],
}));
