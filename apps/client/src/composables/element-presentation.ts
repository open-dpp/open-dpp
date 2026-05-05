import { KeyTypes, type KeyTypesType, type PresentationComponentNameType } from "@open-dpp/dto";
import { PRESENTATION_COMPONENTS } from "../components/presentation/components/presentation-components";
import {
  type LeafElement,
  resolveI18nKey,
} from "../components/presentation/components/presentation-element-helpers";

export const DEFAULT_VALUE = "default";

export interface SelectOption {
  label: string;
  value: string;
}

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
      options.push({ label: translate(resolveI18nKey(name, entry)), value: name });
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
