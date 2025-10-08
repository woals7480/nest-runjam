import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFull1759928728556 implements MigrationInterface {
    name = 'InitFull1759928728556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "shoes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "brand" character varying NOT NULL,
                "model" character varying NOT NULL,
                "nickname" character varying,
                "totalMileage" numeric NOT NULL DEFAULT '0',
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_5367569fb93ba8de671a6890aae" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ac2d10c4478160bd50e77b9496" ON "shoes" ("userId", "nickname")
        `);
        await queryRunner.query(`
            CREATE TABLE "shoe_mileages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "shoeId" uuid NOT NULL,
                "runId" uuid NOT NULL,
                CONSTRAINT "REL_cc6e1512634697b7557cb91ebf" UNIQUE ("runId"),
                CONSTRAINT "PK_135dce8e711164270239ffee74c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_cc6e1512634697b7557cb91ebf" ON "shoe_mileages" ("runId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_309759763dd65b2fda9a053232" ON "shoe_mileages" ("shoeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "runs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                "runAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "distance" numeric(6, 2) NOT NULL,
                "durationSec" integer NOT NULL DEFAULT '0',
                "note" character varying,
                CONSTRAINT "PK_46d6a1e257c38ba58f1a3c30836" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_902e73b3fbb114898e5ea83ea0" ON "runs" ("userId", "runAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "nickname" character varying NOT NULL,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
        await queryRunner.query(`
            ALTER TABLE "shoes"
            ADD CONSTRAINT "FK_5e3677fae3775c31efad3bc72f7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages"
            ADD CONSTRAINT "FK_309759763dd65b2fda9a053232b" FOREIGN KEY ("shoeId") REFERENCES "shoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages"
            ADD CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "runs"
            ADD CONSTRAINT "FK_336a74d21129fee621d57b01799" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "runs" DROP CONSTRAINT "FK_336a74d21129fee621d57b01799"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages" DROP CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages" DROP CONSTRAINT "FK_309759763dd65b2fda9a053232b"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoes" DROP CONSTRAINT "FK_5e3677fae3775c31efad3bc72f7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_902e73b3fbb114898e5ea83ea0"
        `);
        await queryRunner.query(`
            DROP TABLE "runs"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_309759763dd65b2fda9a053232"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cc6e1512634697b7557cb91ebf"
        `);
        await queryRunner.query(`
            DROP TABLE "shoe_mileages"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ac2d10c4478160bd50e77b9496"
        `);
        await queryRunner.query(`
            DROP TABLE "shoes"
        `);
    }

}
