import { ActivityTypesType } from "./activity-types";
import { IActivity } from "./activity";

// Define the static side of the classes
export interface ActivityStatic {
  fromPlain: (data: unknown) => IActivity;
}

// Create the registry
export const registry = new Map<ActivityTypesType, ActivityStatic>();

// Type-safe registration function
export function registerActivity(type: ActivityTypesType, constructor: ActivityStatic): void {
  registry.set(type, constructor);
}

// Type-safe getter
export function getActivityClass(type: ActivityTypesType): ActivityStatic {
  const constructor = registry.get(type);
  if (!constructor) {
    throw new Error(`No class registered for type ${type}`);
  }
  return constructor;
}
