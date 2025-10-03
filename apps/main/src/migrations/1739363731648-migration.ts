import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739363731648 implements MigrationInterface {
  name = "MakeColumnDescriptionOptional1739363731648";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
