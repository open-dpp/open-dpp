import type { PresentationComponentNameType, SubmodelElementResponseDto } from "@open-dpp/dto";
import type { Component } from "vue";
import { isIntegerDataType, isNumericDataType, PresentationComponentName } from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";
import {
  isProperty,
  type LeafElement,
  type SampleElementResult,
  sampleWhen,
} from "./presentation-element-helpers";

export interface PresentationComponentProps {
  element: SubmodelElementResponseDto;
}

export interface PresentationComponentEntry {
  component: Component;
  selfCaptioning: boolean;
  i18nKey?: string;
  appliesTo: (element: LeafElement) => boolean;
  sampleElement: (element: SubmodelElementResponseDto) => SampleElementResult;
}

const INTEGER_SAMPLE_VALUE = "1234567";
const FLOAT_SAMPLE_VALUE = "1234567.89";

function isMissingNumericValue(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return true;
  return Number.isNaN(parseFloat(value));
}

export const PRESENTATION_COMPONENTS: Record<
  PresentationComponentNameType,
  PresentationComponentEntry
> = {
  [PresentationComponentName.BigNumber]: {
    component: BigNumberValue,
    selfCaptioning: true,
    appliesTo: (element) => isProperty(element) && isNumericDataType(element.valueType),
    sampleElement: sampleWhen(
      isProperty,
      (element) => isMissingNumericValue(element.value),
      (element) => ({
        ...element,
        value: isIntegerDataType(element.valueType) ? INTEGER_SAMPLE_VALUE : FLOAT_SAMPLE_VALUE,
      }),
    ),
  },
};
