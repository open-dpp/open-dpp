import type {
  KeyTypesType,
  PresentationComponentNameType,
  PropertyResponseDto,
  SubmodelElementResponseDto,
  SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import type { Component } from "vue";
import {
  isIntegerDataType,
  isNumericDataType,
  KeyTypes,
  PresentationComponentName,
} from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";

export interface PresentationComponentProps {
  element: SubmodelElementResponseDto;
}

type LeafElement = SubmodelElementSharedResponseDto & {
  modelType: KeyTypesType;
  valueType?: string;
};

export interface SampleElementResult {
  element: SubmodelElementResponseDto;
  usedSample: boolean;
}

export interface PresentationComponentEntry {
  component: Component;
  selfCaptioning: boolean;
  i18nKey: string;
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

function bigNumberSampleElement(element: SubmodelElementResponseDto): SampleElementResult {
  if (element.modelType !== KeyTypes.Property) {
    return { element, usedSample: false };
  }
  const property = element as unknown as PropertyResponseDto;
  if (!isMissingNumericValue(property.value)) {
    return { element, usedSample: false };
  }
  const sampleValue = isIntegerDataType(property.valueType)
    ? INTEGER_SAMPLE_VALUE
    : FLOAT_SAMPLE_VALUE;
  return {
    element: { ...property, value: sampleValue } as unknown as SubmodelElementResponseDto,
    usedSample: true,
  };
}

export const PRESENTATION_COMPONENTS: Record<
  PresentationComponentNameType,
  PresentationComponentEntry
> = {
  [PresentationComponentName.BigNumber]: {
    component: BigNumberValue,
    selfCaptioning: true,
    i18nKey: "aasEditor.presentationTab.bigNumber",
    appliesTo: (element) =>
      element.modelType === KeyTypes.Property && isNumericDataType(element.valueType),
    sampleElement: bigNumberSampleElement,
  },
};
