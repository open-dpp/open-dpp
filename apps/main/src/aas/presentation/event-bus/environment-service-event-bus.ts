import { DbSessionOptions } from "../../../database/query-options";
import { DeleteSubmodelBaseEvent, MoveSubmodelBaseEvent } from "./submodel-base-events";
import { DeleteSubmodelBaseObserver } from "./delete-submodel-base-observer";
import { MoveSubmodelBaseObserver } from "./move-submodel-base-observer";

export class EnvironmentServiceEventBus {
  private deleteEvents: DeleteSubmodelBaseEvent[] = [];
  private moveEvents: MoveSubmodelBaseEvent[] = [];

  private constructor(
    private deleteObservers: DeleteSubmodelBaseObserver[],
    private moveObservers: MoveSubmodelBaseObserver[],
  ) {}
  static create(data: {
    deleteObservers?: DeleteSubmodelBaseObserver[];
    moveObservers?: MoveSubmodelBaseObserver[];
  }) {
    return new EnvironmentServiceEventBus(data.deleteObservers ?? [], data.moveObservers ?? []);
  }

  publishDeleteEvent(event: DeleteSubmodelBaseEvent) {
    this.deleteEvents.push(event);
  }
  publishMoveEvent(event: MoveSubmodelBaseEvent) {
    this.moveEvents.push(event);
  }

  async notify(options?: DbSessionOptions) {
    for (const { oldPath, newPath } of this.moveEvents) {
      for (const observer of this.moveObservers) {
        await observer.onMove({ oldPath, newPath }, options);
      }
    }
    for (const { pathToDelete } of this.deleteEvents) {
      for (const observer of this.deleteObservers) {
        await observer.onDelete({ pathToDelete }, options);
      }
    }
  }
}
