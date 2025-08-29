import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === 'true' ? { ca: process.env.DB_CA_CERT } : undefined,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});
