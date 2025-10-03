import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738520732607 implements MigrationInterface {
  name = "RenameProductToModel1738520732607";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_91cfdc7f38959f4817c6372c019"`,
    );

    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_5519c7b895f8c870338750c6530"`,
    );

    await queryRunner.query(`ALTER TABLE "product" RENAME TO "model"`);

    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_5519c7b895f8c870338750c6530" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_91cfdc7f38959f4817c6372c019" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_91cfdc7f38959f4817c6372c019"`,
    );

    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_5519c7b895f8c870338750c6530"`,
    );

    await queryRunner.query(`ALTER TABLE "model" RENAME TO "product"`);

    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_5519c7b895f8c870338750c6530" FOREIGN KEY ("modelId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_91cfdc7f38959f4817c6372c019" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
