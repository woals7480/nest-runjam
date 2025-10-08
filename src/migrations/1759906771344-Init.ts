import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1759906771344 implements MigrationInterface {
    name = 'Init1759906771344'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shoes"
            ALTER COLUMN "totalMileage" TYPE numeric
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages" DROP CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages"
            ADD CONSTRAINT "UQ_cc6e1512634697b7557cb91ebf8" UNIQUE ("runId")
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages"
            ADD CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages" DROP CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages" DROP CONSTRAINT "UQ_cc6e1512634697b7557cb91ebf8"
        `);
        await queryRunner.query(`
            ALTER TABLE "shoe_mileages"
            ADD CONSTRAINT "FK_cc6e1512634697b7557cb91ebf8" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shoes"
            ALTER COLUMN "totalMileage" TYPE numeric
        `);
    }

}
