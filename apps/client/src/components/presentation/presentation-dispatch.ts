import type { PresentationConfigurationDto, SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { usePassportStore } from "../../stores/passport";
import { PRESENTATION_COMPONENTS } from "./components/presentation-components";
import { resolveComponent } from "./presentation-config";

export function usePresentationDispatch(
  getElement: () => SubmodelElementResponseDto,
  getPath: () => string | undefined,
  getConfig?: () => PresentationConfigurationDto | null | undefined,
) {
  const passportStore = usePassportStore();

  const config = computed(() => {
    if (getConfig) {
      const explicit = getConfig();
      if (explicit !== undefined) return explicit;
    }
    return passportStore.presentationConfig;
  });

  const name = computed(() => {
    const path = getPath();
    if (!path) return undefined;
    return resolveComponent(config.value, {
      path,
      modelType: getElement().modelType,
    });
  });

  const entry = computed(() => (name.value ? PRESENTATION_COMPONENTS[name.value] : undefined));
  const component = computed(() => entry.value?.component);
  const selfCaptioning = computed(() => entry.value?.selfCaptioning ?? false);

  return { name, component, selfCaptioning };
}
