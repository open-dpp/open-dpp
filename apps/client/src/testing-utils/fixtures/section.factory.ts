import type {
  DataFieldDto,
  SectionDto,
} from "@open-dpp/api-client";
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";
import { Factory } from "fishery";

export const dataFieldFactory = Factory.define<DataFieldDto>(
  ({ sequence }) => ({
    id: `field-${sequence}`,
    name: `Field ${sequence}`,
    type: DataFieldType.TEXT_FIELD,
    granularityLevel: GranularityLevel.ITEM,
  }),
);

interface SectionTransientParams {
  numberOfDataFields?: number;
}

export const sectionFactory = Factory.define<
  SectionDto,
  SectionTransientParams
>(({ transientParams, sequence }) => ({
  id: `section-${sequence}`,
  name: `Section ${sequence}`,
  type: SectionType.GROUP,
  subSections: [],
  dataFields: dataFieldFactory.buildList(
    transientParams.numberOfDataFields ?? 2,
  ),
}));
