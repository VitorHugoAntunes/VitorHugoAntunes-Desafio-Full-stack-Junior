import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateNotificationsTable1704000000000 implements MigrationInterface {
    name = 'CreateNotificationsTable1704000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.createTable(
            new Table({
                name: "notifications",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "user_id",
                        type: "varchar",
                    },
                    {
                        name: "task_id",
                        type: "varchar",
                    },
                    {
                        name: "type",
                        type: "enum",
                        enum: ["TASK_ASSIGNED", "TASK_STATUS_CHANGED", "TASK_COMMENT_ADDED"],
                    },
                    {
                        name: "data",
                        type: "jsonb",
                    },
                    {
                        name: "is_read",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            "notifications",
            new TableIndex({
                name: "IDX_notifications_user_id",
                columnNames: ["user_id"],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("notifications", "IDX_notifications_user_id");
        await queryRunner.dropTable("notifications");
    }
}