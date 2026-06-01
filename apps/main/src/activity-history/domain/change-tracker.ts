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
  return trackable;
}

export class ChangeTracker {
  private _changes: Array<IChangeEvent> = [];
  readonly #onPullCallback?: () => void; // Ignore function in jest equal check by prefix it with #
  private constructor(onPullCallback?: () => void) {
    this.#onPullCallback = onPullCallback;
  }

  static create(data?: { onPullCallback?: () => void }): ChangeTracker {
    return new ChangeTracker(data?.onPullCallback);
  }

  track(...changes: IChangeEvent[]) {
    this._changes.push(...changes);
  }

  pull(): Array<IChangeEvent> {
    const changes = [...this._changes];

    this._changes = [];
    if (this.#onPullCallback) {
      this.#onPullCallback();
    }
    return changes;
  }
}
