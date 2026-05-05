import type {
  PresentationComponentNameType,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import type { Component } from "vue";
import { isIntegerDataType, isNumericDataType, PresentationComponentName } from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";
import {
  isProperty,
  type LeafElement,
  type SampleElementResult,
  sampleWhen,
} from "./presentation-element-helpers";

/**
 * Adding a new presentation component:
 *   1. Add the name to PresentationComponentName in
 *      packages/dto/src/presentation-configurations/presentation-configuration.dto.ts
 *   2. Create the .vue component in this folder.
 *   3. Add an entry to PRESENTATION_COMPONENTS below. Use the typed guards
 *      (isProperty, ...) and the sampleWhen() combinator from
 *      presentation-element-helpers.ts to avoid casts and boilerplate.
 *   4. (Optional) Add label translations under aasEditor.presentationTab.<name>
 *      in apps/client/src/locales/{en,de}.json. If omitted, the i18n key
 *      defaults to aasEditor.presentationTab.<camelCaseName>.
 *
 * The Record<PresentationComponentNameType, ...> type forces parity with the
 * DTO enum: TS errors here if you add a name to the enum without registering it.
 */

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
