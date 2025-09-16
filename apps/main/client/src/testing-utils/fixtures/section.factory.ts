import { Factory } from "fishery";
import {
  DataFieldDto,
  DataFieldType,
  GranularityLevel,
  SectionDto,
} from "@open-dpp/api-client";
import { SectionType } from "@open-dpp/api-client";

export const dataFieldFactory = Factory.define<DataFieldDto>(
  ({ sequence }) => ({
    id: `field-${sequence}`,
    name: `Field ${sequence}`,
    type: DataFieldType.TEXT_FIELD,
    granularityLevel: GranularityLevel.ITEM,
  }),
);

type SectionTransientParams = {
  numberOfDataFields?: number;
};

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
