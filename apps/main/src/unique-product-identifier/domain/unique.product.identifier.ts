import { randomUUID } from 'crypto';

export class UniqueProductIdentifier {
  private constructor(
    public readonly uuid: string,
    public readonly referenceId: string,
  ) {}

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
