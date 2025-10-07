// src/typeorm.config.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_SSL === 'true' || isProd;

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  // 런타임(dist)에서도 잘 잡히게 ts/js 모두 포함
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // 서버리스/저코스트 시작: 커넥션 수 낮게
  extra: { max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 },
});

export default dataSource;
