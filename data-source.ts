// src/typeorm.config.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_SSL === 'true' || isProd;

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  extra: { max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 },
  synchronize: false,
});
