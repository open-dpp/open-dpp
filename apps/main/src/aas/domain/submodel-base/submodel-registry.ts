import { KeyTypesType } from "../common/key-types-enum";
import { SubmodelBase } from "./submodel-base";

// Define the static side of the classes
export interface SubmodelStatic {
  fromPlain: (data: Record<string, unknown>) => SubmodelBase;
}

// Create the registry
export const registry = new Map<KeyTypesType, SubmodelStatic>();

// Type-safe registration function
export function registerSubmodel(
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
