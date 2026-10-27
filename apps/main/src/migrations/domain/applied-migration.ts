import { assertValidMigrationId } from "./migration";

export class AppliedMigration {
  private constructor(
    public readonly id: string,
    public readonly appliedAt: Date,
  ) {}

  static create(data: { id: string; appliedAt?: Date }): AppliedMigration {
    assertValidMigrationId(data.id);
    return new AppliedMigration(data.id, data.appliedAt ?? new Date());
  }

  toPlain() {
    return {
      id: this.id,
      appliedAt: this.appliedAt,
    };
  }
}
