import { KeyTypesType } from "../common/key-types-enum";

import { ISubmodelElement } from "./submodel-base";

// Define the static side of the classes
export interface SubmodelStatic {
  fromPlain: (data: unknown) => ISubmodelElement;
}

// Create the registry
export const registry = new Map<KeyTypesType, SubmodelStatic>();

// Type-safe registration function
export function registerSubmodelElement(
  type: KeyTypesType,
  constructor: SubmodelStatic,
): void {
  registry.set(type, constructor);
}

// Type-safe getter
export function getSubmodelClass(type: KeyTypesType): SubmodelStatic {
  const constructor = registry.get(type);
  if (!constructor) {
    throw new Error(`No class registered for type ${type}`);
  }
  return constructor;
}
