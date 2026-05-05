import {
  KeyTypes,
  type KeyTypesType,
  type PresentationComponentNameType,
  type PropertyResponseDto,
  type SubmodelElementResponseDto,
  type SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";

export type LeafElement = SubmodelElementSharedResponseDto & {
  modelType: KeyTypesType;
  valueType?: string;
};

export interface SampleElementResult {
  element: SubmodelElementResponseDto;
  usedSample: boolean;
}

type PropertyElement = SubmodelElementResponseDto & PropertyResponseDto;

export function isProperty(element: SubmodelElementResponseDto): element is PropertyElement {
  return element.modelType === KeyTypes.Property;
}

export function sampleWhen<T extends SubmodelElementResponseDto>(
  match: (el: SubmodelElementResponseDto) => el is T,
  isMissing: (el: T) => boolean,
  fabricate: (el: T) => T,
): (el: SubmodelElementResponseDto) => SampleElementResult {
  return (element) => {
    if (!match(element)) return { element, usedSample: false };
    if (!isMissing(element)) return { element, usedSample: false };
    return { element: fabricate(element), usedSample: true };
  };
}

const I18N_PREFIX = "aasEditor.presentationTab.";

export function resolveI18nKey(
  name: PresentationComponentNameType,
  entry: { i18nKey?: string },
): string {
  if (entry.i18nKey) return entry.i18nKey;
  return `${I18N_PREFIX}${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}
