import type { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1741703004084 implements MigrationInterface {
  name = 'AddUserAndOrganizationColumnToProductDataModel1741703004084'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD "createdByUserId" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD "ownedByOrganizationId" uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD CONSTRAINT "FK_4463b683720ec9636b4c5e81fe2" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" ADD CONSTRAINT "FK_24a09c9f0a1c94749be2a0ef310" FOREIGN KEY ("ownedByOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP CONSTRAINT "FK_24a09c9f0a1c94749be2a0ef310"`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP CONSTRAINT "FK_4463b683720ec9636b4c5e81fe2"`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP COLUMN "ownedByOrganizationId"`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_data_model" DROP COLUMN "createdByUserId"`,
    )
  }
}
