import migratePkg from '@prisma/migrate';
import { defineConfig } from 'prisma/config';
import prismaInternals from '@prisma/internals';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/db';

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

async function resolveFailedMigrations(
  migrate: any,
  config: any,
  baseDir: string,
  migrationsDirPath: string,
  schemaContext: any,
) {
  const logger = log('migrations');

  // Use Prisma Client to mark failed migrations as rolled back
  try {
    const failedMigrations = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
      `SELECT migration_name FROM _prisma_migrations 
       WHERE applied = false AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    );

    if (failedMigrations.length > 0) {
      logger.warn(`found ${failedMigrations.length} failed migration(s), marking as rolled back...`);
      for (const mig of failedMigrations) {
        await prisma.$executeRawUnsafe(
          `UPDATE _prisma_migrations SET rolled_back_at = now(), logs = $1 WHERE migration_name = $2`,
          ['Marked as rolled back by Zipline auto-resolve', mig.migration_name],
        );
        logger.info(`rolled back migration: ${mig.migration_name}`);
      }
    }
  } catch (resolveErr) {
    logger.error(`Failed to resolve migration state: ${String(resolveErr)}`);
    throw resolveErr;
  }

  // Retry with fresh migrate instance
  await migrate.stop();
  const migrate2 = await Migrate.setup({
    schemaEngineConfig: config,
    baseDir,
    migrationsDirPath,
    schemaContext,
  });

  const retryResult = await migrate2.applyMigrations();
  await migrate2.stop();
  return retryResult.appliedMigrationNames;
}

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
  } catch (e: any) {
    if (
      e?.code === 'P3018' ||
      e?.message?.includes('Migration failed to apply') ||
      e?.message?.includes('already exists')
    ) {
      logger.warn('migration failed, attempting to auto-resolve...');
      try {
        migrationIds = await resolveFailedMigrations(
          migrate,
          config,
          baseDir,
          migrationsDirPath,
          schemaContext,
        );
      } catch (resolveErr) {
        logger.error(`Auto-resolve failed: ${String(resolveErr)}`);
        await migrate.stop();
        process.exit(1);
      }
    } else {
      logger.error('Failed to apply migrations:');
      logger.error(e instanceof Error ? e.message : String(e));
      if (e instanceof Error && e.stack) {
        logger.error(e.stack);
      }

      await migrate.stop();
      process.exit(1);
    }
  } finally {
    await migrate.stop();
  }

  if (migrationIds?.length === 0) {
    logger.info('database is up to date - no migrations needed');
    return;
  }

  logger.info(`successfully applied ${migrationIds.length} migration(s): ${migrationIds.join(', ')}`);
}
