import { IChangeEvent } from "./change-events/change-event";

export interface ITrackable {
  eventQueue: ChangeEventQueue;
}

export class ChangeEventQueue {
  private _changes: Array<IChangeEvent> = [];
  private constructor(private onPublishCallback?: () => void) {}

  static create(data?: { onPublishCallback?: () => void }): ChangeEventQueue {
    return new ChangeEventQueue(data?.onPublishCallback);
  }

  publish(...changes: IChangeEvent[]) {
    this._changes.push(...changes);
    if (this.onPublishCallback) {
      this.onPublishCallback();
    }
  }

  pull(): Array<IChangeEvent> {
    const events = [...this._changes];

    this._changes = [];
    return events;
  }
}
