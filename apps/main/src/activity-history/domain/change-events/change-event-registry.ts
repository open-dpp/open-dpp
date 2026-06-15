import { ChangeEventTypesType } from "./change-event-types";
import { IChangeEvent } from "./change-event";

// Define the static side of the classes
export interface ChangeEventStatic {
  fromPlain: (data: unknown) => IChangeEvent;
}

// Create the registry
export const registry = new Map<ChangeEventTypesType, ChangeEventStatic>();

// Type-safe registration function
export function registerChangeEvent(
  type: ChangeEventTypesType,
  constructor: ChangeEventStatic,
): void {
  registry.set(type, constructor);
}

// Type-safe getter
export function getChangeEventClass(type: ChangeEventTypesType): ChangeEventStatic {
  const constructor = registry.get(type);
  if (!constructor) {
    throw new Error(`No class registered for type ${type}`);
  }
  return constructor;
}
