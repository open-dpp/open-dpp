import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738337716096 implements MigrationInterface {
  name = "RenamePermalinkToUniqueProductIdentifier1738337716096";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permalink" RENAME TO "unique_product_identifier"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "unique_product_identifier" RENAME TO "permalink"`,
    );
  }
}
