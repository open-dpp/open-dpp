import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1742981609904 implements MigrationInterface {
  name = "RemoveProductDataModelTables1742981609904";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "data_field"`);
    await queryRunner.query(`DROP TABLE "data_section"`);
    await queryRunner.query(`DROP TABLE "product_data_model"`);
  }

  public async down(): Promise<void> {}
}
