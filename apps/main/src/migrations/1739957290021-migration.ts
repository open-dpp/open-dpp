import type { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1739957290021 implements MigrationInterface {
  name = 'Migration1739957290021'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_value" ADD "row" integer`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_value" DROP COLUMN "row"`)
  }
}
