import type {
  KeyTypesType,
  PresentationComponentNameType,
  PresentationConfigurationDto,
} from "@open-dpp/dto";
import { KeyTypesEnum } from "@open-dpp/dto";
import type { InjectionKey, Ref } from "vue";

export const presentationConfigKey: InjectionKey<Ref<PresentationConfigurationDto | null>> =
  Symbol("presentationConfig");

export function resolveComponent(
  config: PresentationConfigurationDto | null | undefined,
  element: { path: string; modelType: string },
): PresentationComponentNameType | undefined {
  if (!config) return undefined;
  const byPath = config.elementDesign?.[element.path];
  if (byPath) return byPath;
  const parsedModelType = KeyTypesEnum.safeParse(element.modelType);
  if (!parsedModelType.success) return undefined;
  const defaults = config.defaultComponents as
    | Partial<Record<KeyTypesType, PresentationComponentNameType>>
    | undefined;
  return defaults?.[parsedModelType.data];
}
