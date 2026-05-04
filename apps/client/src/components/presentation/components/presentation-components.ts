import type {
  KeyTypesType,
  PresentationComponentNameType,
  SubmodelElementResponseDto,
  SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import type { Component } from "vue";
import { isNumericDataType, KeyTypes, PresentationComponentName } from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";

export interface PresentationComponentProps {
  element: SubmodelElementResponseDto;
}

type LeafElement = SubmodelElementSharedResponseDto & {
  modelType: KeyTypesType;
  valueType?: string;
};

export interface PresentationComponentEntry {
  component: Component;
  selfCaptioning: boolean;
  i18nKey: string;
  appliesTo: (element: LeafElement) => boolean;
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
  },
};
