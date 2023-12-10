import {MigrationInterface, QueryRunner} from "typeorm";

export class addpartialindexforlocalnote1702199825139 implements MigrationInterface {
    name = 'addpartialindexforlocalnote1702199825139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_partial_local_noteid on note (id) WHERE "userHost" IS NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_partial_local_noteid"`, undefined);
    }

}
