import type {
  PresentationComponentNameType,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import type { Component } from "vue";
import { PresentationComponentName } from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";

// Contract every presentation component must honour. Keep it narrow so new
// components can be added without threading extra props through
// `PresentationComponentRenderer`. Richer per-component configuration should
// flow through the element itself (extensions, semanticId) or a dedicated
// slot on the renderer, not through broadening this interface.
export interface PresentationComponentProps {
  element: SubmodelElementResponseDto;
}

export interface PresentationComponentEntry {
  component: Component;
  /**
   * `true` when the component renders its own field label (e.g. the caption
   * inside a BigNumber card). Consumers that would otherwise render a
   * surrounding `<dt>` label should suppress it when this is set, to avoid
   * showing the same name twice.
   */
  selfCaptioning: boolean;
}

// Registry of all presentation components the viewer and the Presentation tab
// can resolve. To add a new component:
//   1. Add a new entry to `PresentationComponentName` in
//      `packages/dto/src/presentation-configurations/presentation-configuration.dto.ts`.
//   2. Implement a `.vue` component in this directory that accepts
//      `PresentationComponentProps`.
//   3. Add it to this record. The `Record<...>` type will force exhaustiveness.
export const PRESENTATION_COMPONENTS: Record<
  PresentationComponentNameType,
  PresentationComponentEntry
> = {
  [PresentationComponentName.BigNumber]: {
    component: BigNumberValue,
    selfCaptioning: true,
  },
};
