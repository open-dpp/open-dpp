import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed, inject } from "vue";
import { PRESENTATION_COMPONENTS } from "./components/presentation-components";
import { presentationConfigKey, resolveComponent } from "./presentation-config";

export function usePresentationDispatch(
  getElement: () => SubmodelElementResponseDto,
  getPath: () => string | undefined,
) {
  const configRef = inject(presentationConfigKey, null);

  const name = computed(() => {
    const path = getPath();
    if (!path) return undefined;
    return resolveComponent(configRef?.value ?? null, {
      path,
      modelType: getElement().modelType,
    });
  });

  const entry = computed(() => (name.value ? PRESENTATION_COMPONENTS[name.value] : undefined));
  const component = computed(() => entry.value?.component);
  const selfCaptioning = computed(() => entry.value?.selfCaptioning ?? false);

  return { name, component, selfCaptioning };
}
