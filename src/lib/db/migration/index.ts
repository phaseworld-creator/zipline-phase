import migratePkg from '@prisma/migrate';
import { defineConfig } from 'prisma/config';
import prismaInternals from '@prisma/internals';
import { log } from '@/lib/logger';

import ensureDatabaseExistsPkg from '@prisma/migrate/dist/utils/ensureDatabaseExists.js';

const { Migrate } = migratePkg;
const { ensureDatabaseExists } = ensureDatabaseExistsPkg;
const {
  createSchemaPathInput,
  getSchemaDatasourceProvider,
  inferDirectoryConfig,
  loadSchemaContext,
  validatePrismaConfigWithDatasource,
} = prismaInternals;

export async function runMigrations() {
  const baseDir = process.cwd();

  const config = defineConfig({
    schema: './prisma/schema.prisma',
    migrations: { path: './prisma/migrations' },
    datasource: { url: process.env.DATABASE_URL! },
  });

  const schemaContext = await loadSchemaContext({
    schemaPath: createSchemaPathInput({ schemaPathFromConfig: config.schema, baseDir }),
    printLoadMessage: false,
  });

  const { migrationsDirPath } = inferDirectoryConfig(schemaContext, config);
  const validatedConfig = validatePrismaConfigWithDatasource({ config, cmd: 'migrate deploy' });

  const migrate = await Migrate.setup({
    schemaEngineConfig: config,
    baseDir,
    migrationsDirPath,
    schemaContext,
  });

  const logger = log('migrations');
  logger.info('running database migrations...');

  try {
    logger.debug('ensuring database exists...');

    const dbCreated = await ensureDatabaseExists(
      baseDir,
      getSchemaDatasourceProvider(schemaContext),
      validatedConfig,
    );
    if (dbCreated) {
      logger.info('database created');
    }
  } catch (e) {
    logger.error('Failed to create database:');
    logger.error(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) {
      logger.error(e.stack);
    }
    logger.error('Try creating the database manually and running the server again');

    await migrate.stop();
    process.exit(1);
  }

  let migrationIds: string[];
  try {
    logger.info('applying pending migrations...');
    const { appliedMigrationNames } = await migrate.applyMigrations();
    migrationIds = appliedMigrationNames;
  } catch (e) {
    logger.error('Failed to apply migrations:');
    logger.error(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) {
      logger.error(e.stack);
    }

    await migrate.stop();
    process.exit(1);
  } finally {
    await migrate.stop();
  }

  if (migrationIds?.length === 0) {
    logger.info('database is up to date - no migrations needed');
    return;
  }

  logger.info(`successfully applied ${migrationIds.length} migration(s): ${migrationIds.join(', ')}`);
}
