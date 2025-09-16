import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1739872953880 implements MigrationInterface {
  name = 'Migration1739872953880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Organization" ADD "createdByUserId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" ADD "ownedByUserId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" ADD CONSTRAINT "FK_0ef8ca415e2b7179760d832485d" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" ADD CONSTRAINT "FK_2b1dc90c0a91ebc66174991d721" FOREIGN KEY ("ownedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Organization" DROP CONSTRAINT "FK_2b1dc90c0a91ebc66174991d721"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" DROP CONSTRAINT "FK_0ef8ca415e2b7179760d832485d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" DROP COLUMN "ownedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Organization" DROP COLUMN "createdByUserId"`,
    );
  }
}
