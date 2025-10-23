import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTasksTables1704000000000 implements MigrationInterface {
    name = 'CreateTasksTables1704000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.createTable(
            new Table({
                name: "tasks",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "title",
                        type: "varchar",
                    },
                    {
                        name: "description",
                        type: "varchar",
                    },
                    {
                        name: "due_date",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "priority",
                        type: "enum",
                        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                        default: "'MEDIUM'",
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
                        default: "'TODO'",
                    },
                    {
                        name: "author_id",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "assignee_ids",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        await queryRunner.createTable(
            new Table({
                name: "task_history",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "task_id",
                        type: "varchar",
                    },
                    {
                        name: "user_id",
                        type: "varchar",
                    },
                    {
                        name: "changes",
                        type: "jsonb",
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

        await queryRunner.createTable(
            new Table({
                name: "comments",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "content",
                        type: "varchar",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "author_id",
                        type: "varchar",
                    },
                    {
                        name: "task_id",
                        type: "varchar",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("comments");
        await queryRunner.dropTable("task_history");
        await queryRunner.dropTable("tasks");
    }
}