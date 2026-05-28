import { IChangeEvent } from "../change-events/change-event";

export interface ITrackable {
  eventQueue: EventQueue;
}

export class EventQueue {
  private _changes: Array<IChangeEvent> = [];
  private constructor(private onPublishCallback?: () => void) {}

  static create(data?: { onPublishCallback?: () => void }): EventQueue {
    return new EventQueue(data?.onPublishCallback);
  }

  publishChanges(...changes: IChangeEvent[]) {
    this._changes.push(...changes);
    if (this.onPublishCallback) {
      this.onPublishCallback();
    }
  }

  pullChanges(): Array<IChangeEvent> {
    const events = [...this._changes];

    this._changes = [];
    return events;
  }
}
