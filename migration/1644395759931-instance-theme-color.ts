import {MigrationInterface, QueryRunner} from "typeorm";

export class instanceThemeColor1644395759931 implements MigrationInterface {
    name = 'instanceThemeColor1644395759931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "themeColor" character varying(512)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "themeColor"`);
    }

}
