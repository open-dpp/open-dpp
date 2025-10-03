import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740245525113 implements MigrationInterface {
  name = "AddOrganizationColumnToModel1740245525113";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_91cfdc7f38959f4817c6372c019"`,
    );

    await queryRunner.query(
      `ALTER TABLE "model" ADD "ownedByOrganizationId" uuid NULL`,
    );

    // Update the model table by assigning the first found orga for each user
    await queryRunner.query(`
        UPDATE "model" m
        SET "ownedByOrganizationId" = (
            SELECT ou.organization_id
            FROM "organization_user" ou
            WHERE ou.user_id = m."createdByUserId"
            ORDER BY ou.organization_id ASC
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM "organization_user" ou WHERE ou.user_id = m."createdByUserId"
        );
    `);

    // Make ownedByOrganizationId column NOT NULL if all models have been assigned an organization
    await queryRunner.query(`
        ALTER TABLE "model" ALTER COLUMN "ownedByOrganizationId" SET NOT NULL;
    `);

    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_fb18411db6f84a55ee00629b983" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_28771479685648d28539263b4e3" FOREIGN KEY ("ownedByOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_28771479685648d28539263b4e3"`,
    );

    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_fb18411db6f84a55ee00629b983"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" DROP COLUMN "ownedByOrganizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_91cfdc7f38959f4817c6372c019" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
