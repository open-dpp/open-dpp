import { IChangeEvent } from "./change-events/change-event";

export interface ITrackable {
  tracker: ChangeTracker;
  withTracking(changeTracker?: ChangeTracker): this;
}

export function withTrackingHelper<T extends ITrackable>(
  changeTracker: ChangeTracker | undefined,
  trackable: T,
): T {
  trackable.tracker = changeTracker ?? trackable.tracker;
  trackable.tracker.startTracking();
  return trackable;
}

export class ChangeTracker {
  private _changes: Array<IChangeEvent> = [];
  private trackingEnabled = false;
  readonly #onStopCallback?: () => void; // Ignore function in jest equal check by prefix it with #
  private constructor(onStopCallback?: () => void) {
    this.#onStopCallback = onStopCallback;
  }

  static create(data?: { onStopCallback?: () => void }): ChangeTracker {
    return new ChangeTracker(data?.onStopCallback);
  }

  static fromChanges(changes: Array<IChangeEvent>): ChangeTracker {
    const tracker = new ChangeTracker();
    tracker._changes = changes;
    return tracker;
  }

  startTracking() {
    this.trackingEnabled = true;
  }

  track(...changes: IChangeEvent[]) {
    if (this.trackingEnabled) {
      for (const change of changes) {
        if (!change.isNoop()) {
          this._changes.push(...changes);
        }
      }
    }
  }

  stop(): Array<IChangeEvent> {
    const changes = [...this._changes];

    this._changes = [];
    if (this.#onStopCallback) {
      this.#onStopCallback();
    }
    this.trackingEnabled = false;
    return changes;
  }
}
