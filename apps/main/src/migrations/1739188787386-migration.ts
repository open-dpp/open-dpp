import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739188787386 implements MigrationInterface {
  name = "AddVersionColumnToProductDataModel1739188787386";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD "version" character varying NOT NULL DEFAULT '1.0.0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ALTER COLUMN "version" DROP DEFAULT;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP COLUMN "version"`,
    );
  }
}
