import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function clearDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Conectado ao banco de dados. Limpando tabelas...');

    await dataSource.query('TRUNCATE TABLE "notifications" RESTART IDENTITY CASCADE;');
    await dataSource.query('TRUNCATE TABLE "task_history" RESTART IDENTITY CASCADE;');
    await dataSource.query('TRUNCATE TABLE "comments" RESTART IDENTITY CASCADE;');
    await dataSource.query('TRUNCATE TABLE "tasks" RESTART IDENTITY CASCADE;');
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;');

    console.log('Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar o banco:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

clearDatabase();