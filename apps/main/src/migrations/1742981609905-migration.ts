import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1742981609905 implements MigrationInterface {
  name = "RemoveModelItemUniqueProductIdentifierTables1742981609904";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "data_value"`);
    await queryRunner.query(`DROP TABLE "item"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "unique_product_identifier"`);
  }

  public async down(): Promise<void> {}
}
