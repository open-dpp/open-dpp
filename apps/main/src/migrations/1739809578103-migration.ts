import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739809578103 implements MigrationInterface {
  name = "AddNameAndTypeColumn1739809578103";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_section" ADD "name" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_section" ADD "type" character varying NOT NULL DEFAULT 'Group'`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_section" ALTER COLUMN "name" DROP DEFAULT;`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_section" ALTER COLUMN "type" DROP DEFAULT;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_section" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "data_section" DROP COLUMN "name"`);
  }
}
