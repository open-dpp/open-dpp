import {
  KeyTypes,
  type KeyTypesType,
  type PresentationComponentNameType,
  type SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import { PRESENTATION_COMPONENTS } from "../components/presentation/components/presentation-components";

export const DEFAULT_VALUE = "default";

export interface SelectOption {
  label: string;
  value: string;
}

type LeafElement = SubmodelElementSharedResponseDto & {
  modelType: KeyTypesType;
  valueType?: string;
};

export function defaultOption(translate: (key: string) => string): SelectOption {
  return { label: translate("aasEditor.presentationTab.default"), value: DEFAULT_VALUE };
}

export function applicableComponentOptions(
  element: LeafElement,
  translate: (key: string) => string,
): SelectOption[] {
  const options: SelectOption[] = [defaultOption(translate)];
  for (const [name, entry] of Object.entries(PRESENTATION_COMPONENTS) as [
    PresentationComponentNameType,
    (typeof PRESENTATION_COMPONENTS)[PresentationComponentNameType],
  ][]) {
    if (entry.appliesTo(element)) {
      options.push({ label: translate(entry.i18nKey), value: name });
    }
  }
  return options;
}

export function isLeafElement(modelType: KeyTypesType): boolean {
  return (
    modelType === KeyTypes.Property ||
    modelType === KeyTypes.File ||
    modelType === KeyTypes.ReferenceElement
  );
}
