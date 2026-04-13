export class Status {
  private constructor(public readonly version: string) {}

  static create(data: { version: string }) {
    return new Status(data.version);
  }

  toPlain() {
    return { version: this.version };
  }
}
