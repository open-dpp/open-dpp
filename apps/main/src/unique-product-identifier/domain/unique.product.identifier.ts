import { randomUUID } from "node:crypto";

export class UniqueProductIdentifier {
  public readonly uuid: string;
  public readonly referenceId: string;

  private constructor(
    uuid: string,
    referenceId: string,
  ) {
    this.uuid = uuid;
    this.referenceId = referenceId;
  }

  static create(data: {
    externalUUID?: string;
    referenceId: string;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
    );
  }

  static loadFromDb(data: { uuid: string; referenceId: string }) {
    return new UniqueProductIdentifier(data.uuid, data.referenceId);
  }
}
