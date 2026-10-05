# Docker Helper Commands for Zipline

## Quick Start with Docker
```bash
# Start Zipline containers (will auto-migrate on startup)
pnpm docker:start

# View logs
pnpm docker:logs

# Stop Zipline
pnpm docker:stop

# Restart Zipline
pnpm docker:restart
```

## Database Operations (Docker)
```bash
# Manually run migrations inside Docker
pnpm docker:migrate

# Get a shell inside the container
pnpm docker:shell

# Run any CLI command inside Docker
pnpm docker:ctl
```

## Local Development (without Docker)
```bash
# Build locally
pnpm build

# Run development mode locally
pnpm dev

# Run migrations locally
pnpm db:migrate
```

## Docker-Specific Commands
```bash
# Build Docker images
pnpm docker:build

# Start containers
pnpm docker:start

# Stop containers
pnpm docker:stop

# View logs
pnpm docker:logs

# Restart Zipline service
pnpm docker:restart

# Get a shell inside container
pnpm docker:shell
```

## Troubleshooting

### Migration Issues in Docker
If you see errors like "column does not exist":

1. Check if migrations ran:
   ```bash
   pnpm docker:logs
   ```
   Look for: `[migrations] successfully applied X migration(s)`

2. Manually run migrations:
   ```bash
   pnpm docker:migrate
   ```

3. Restart the container:
   ```bash
   pnpm docker:restart
   ```

### Database Connection Issues
1. Check if PostgreSQL is running:
   ```bash
   docker compose ps
   ```

2. Check database logs:
   ```bash
   docker compose logs postgresql
   ```

3. Verify DATABASE_URL in your .env file

### Upload Issues
If you see "invalid file name" errors after migrations, the database schema is likely outdated. Run:
```bash
pnpm docker:migrate
pnpm docker:restart
```

## Advanced Docker Commands
```bash
# Get a shell inside the Zipline container
docker compose exec zipline sh

# Get a shell inside the PostgreSQL container
docker compose exec postgresql bash

# Run Prisma CLI commands
docker compose exec zipline pnpm prisma [command]

# View specific number of log lines
docker compose logs --tail=100 zipline

# View logs with timestamps
docker compose logs -t zipline

# Follow PostgreSQL logs
docker compose logs -f postgresql
```

## Environment Variables

The docker-compose.yml now uses sensible defaults:

- `POSTGRESQL_USER` - defaults to `zipline`
- `POSTGRESQL_PASSWORD` - defaults to `zipline` (override in .env for production!)
- `POSTGRESQL_DB` - defaults to `zipline`

**Important:** Always set a strong `POSTGRESQL_PASSWORD` in your `.env` file for production!

Example `.env`:
```env
POSTGRESQL_USER=zipline
POSTGRESQL_PASSWORD=your-secure-password-here
POSTGRESQL_DB=zipline
```
