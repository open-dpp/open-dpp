import type { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1741705501377 implements MigrationInterface {
  name = 'AddVisibilityColumnToProductDataModel1741705501377'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD "visibility" text NOT NULL DEFAULT 'Public'`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ALTER COLUMN "visibility" DROP DEFAULT`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP COLUMN "visibility"`,
    )
  }
}
