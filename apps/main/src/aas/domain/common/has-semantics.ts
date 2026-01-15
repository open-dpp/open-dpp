import { Reference } from "./reference";

export interface IHasSemantics {
  semanticId: Reference | null;
  supplementalSemanticIds: Reference[];
}
