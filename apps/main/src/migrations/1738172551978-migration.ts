import type { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738172551978 implements MigrationInterface {
  name = "Migration1738172551978";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Organization" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, CONSTRAINT "PK_67bcafc78935cd441a054c6d4ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "item" ("id" uuid NOT NULL, "modelId" uuid, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying NOT NULL, "createdByUserId" character varying NOT NULL, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permalink" ("uuid" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "view" character varying NOT NULL, "referencedId" uuid NOT NULL, CONSTRAINT "PK_173f813ff8b1f47613bc710eaa5" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_user" ("user_id" character varying NOT NULL, "organization_id" uuid NOT NULL, CONSTRAINT "PK_902dc005457d79e570677b8a098" PRIMARY KEY ("user_id", "organization_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f29cfb2e32f6d58394bf0ce7e5" ON "organization_user" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2aaa5ea0d28c4e9196b107781" ON "organization_user" ("organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_5519c7b895f8c870338750c6530" FOREIGN KEY ("modelId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_91cfdc7f38959f4817c6372c019" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_user" ADD CONSTRAINT "FK_f29cfb2e32f6d58394bf0ce7e5c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_user" ADD CONSTRAINT "FK_e2aaa5ea0d28c4e9196b107781e" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_user" DROP CONSTRAINT "FK_e2aaa5ea0d28c4e9196b107781e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_user" DROP CONSTRAINT "FK_f29cfb2e32f6d58394bf0ce7e5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_91cfdc7f38959f4817c6372c019"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_5519c7b895f8c870338750c6530"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2aaa5ea0d28c4e9196b107781"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f29cfb2e32f6d58394bf0ce7e5"`,
    );
    await queryRunner.query(`DROP TABLE "organization_user"`);
    await queryRunner.query(`DROP TABLE "permalink"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(`DROP TABLE "item"`);
    await queryRunner.query(`DROP TABLE "Organization"`);
  }
}
