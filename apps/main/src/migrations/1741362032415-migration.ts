import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1741362032415 implements MigrationInterface {
  name = 'ChangeCascadeToNoActionOfModelUser1741362032415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_fb18411db6f84a55ee00629b983"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_fb18411db6f84a55ee00629b983" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_fb18411db6f84a55ee00629b983"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_fb18411db6f84a55ee00629b983" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
