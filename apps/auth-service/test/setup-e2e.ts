import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

function generateUniqueDatabaseURL(schemaId: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable');
  }

  const url = new URL(process.env.DATABASE_URL);
 
  return url.toString().replace(/\?schema=.*/, '');
}

const schemaId = randomUUID();

let dataSource: DataSource;

beforeAll(async () => {
  const baseDatabaseURL = generateUniqueDatabaseURL(schemaId);

  dataSource = new DataSource({
    type: 'postgres',
    url: baseDatabaseURL,
    schema: schemaId,
    synchronize: false,
    migrations: ['migrations/*.ts'],
    migrationsRun: false,
  });

  await dataSource.initialize();

  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`);

  try {
    await dataSource.runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
    await dataSource.destroy();
  }
});