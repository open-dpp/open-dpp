import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed, inject } from "vue";
import { PRESENTATION_COMPONENTS } from "./components/presentation-components";
import { presentationConfigKey, resolveComponent } from "./presentation-config";

/**
 * Resolves which presentation component (if any) should render for an element
 * at a given path, reading from the presentation config provided via
 * `presentationConfigKey`. Both the value renderer (`PresentationComponentRenderer`)
 * and the row layout (`SubmodelElement`) consult this so their decisions stay
 * in lock-step.
 *
 * Arguments are getters so the caller can hand in reactive props or computeds
 * without having to wrap them in refs.
 */
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
