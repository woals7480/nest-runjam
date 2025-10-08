import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1759927418521 implements MigrationInterface {
    name = 'Init1759927418521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shoes"
            ALTER COLUMN "totalMileage" TYPE numeric
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "shoes"
            ALTER COLUMN "totalMileage" TYPE numeric
        `);
    }

}
