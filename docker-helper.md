# Docker Helper Commands for Zipline

## Quick Start
```bash
# Start Zipline (will auto-migrate on startup)
pnpm start

# View logs
pnpm logs

# Stop Zipline
pnpm stop

# Restart Zipline
pnpm restart
```

## Database Operations
```bash
# Manually run migrations (if auto-migration fails)
pnpm db:migrate

# Create a new migration
pnpm db:migrate:create

# Push schema changes without migration (prototype/dev)
pnpm db:prototype
```

## Development
```bash
# Build the application inside Docker
pnpm build

# Run development mode
pnpm dev

# View OpenAPI spec
pnpm openapi
```

## Docker Management
```bash
# Build Docker images
pnpm docker:build

# Start containers
pnpm docker:up

# Stop containers
pnpm docker:down

# View all logs
pnpm docker:logs
```

## Troubleshooting

### Migration Issues
If you see errors like "column does not exist":

1. Check if migrations ran:
   ```bash
   pnpm logs
   ```
   Look for: `[migrations] successfully applied X migration(s)`

2. Manually run migrations:
   ```bash
   pnpm db:migrate
   ```

3. Restart the container:
   ```bash
   pnpm restart
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
pnpm db:migrate
pnpm restart
```

## Container Access
```bash
# Get a shell inside the Zipline container
docker compose exec zipline sh

# Get a shell inside the PostgreSQL container
docker compose exec postgresql bash

# Run Prisma CLI commands
docker compose exec zipline pnpm prisma [command]
```

## Logs and Debugging
```bash
# Follow Zipline logs
docker compose logs -f zipline

# Follow PostgreSQL logs
docker compose logs -f postgresql

# View last 100 lines
docker compose logs --tail=100 zipline

# View logs with timestamps
docker compose logs -t zipline
```
