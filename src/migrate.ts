// src/migrate.ts
import dataSource from './typeorm.config';

async function main() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
  console.log('✅ Migrations complete');
}

main().catch((e) => {
  console.error('❌ Error during migration run');
  console.error(e);
  process.exit(1);
});
