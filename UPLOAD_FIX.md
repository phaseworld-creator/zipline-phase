# Upload Multipart Boundary Fix & Auto-Migration Setup

## Problems Fixed

### 1. Multipart Boundary Error
**Error:** "no multipart boundary" when uploading files

**Root Cause:** Shell script generators were manually setting `Content-Type: multipart/form-data` header, which breaks the boundary parameter that curl automatically generates.

**Fix:** Removed manual Content-Type headers from shell and flameshot generators.

### 2. Invalid Filename Error (E1009)
**Error:** "E1009: file[0]: invalid file name"

**Root Cause:** Database schema was outdated - missing the `encrypted` column in the `File` table.

**Fix:** 
- Auto-migration already implemented in `src/lib/db/migration/index.ts`
- Improved migration logging for better visibility
- Made `POSTGRESQL_PASSWORD` optional in docker-compose.yml for CI/CD compatibility

### 3. Docker Compose CI/CD Issue
**Error:** Build workflow failing due to required `POSTGRESQL_PASSWORD`

**Fix:** Changed `POSTGRESQL_PASSWORD` from required (`:?`) to optional with default (`:-zipline`)

## How to Fix Your Installation

### Option 1: Docker (Recommended)
```bash
# Restart to trigger auto-migration
pnpm docker:restart

# Check logs to verify migration ran
pnpm docker:logs
```

You should see:
```
[migrations] running database migrations...
[migrations] successfully applied X migration(s): ...
```

### Option 2: Manual Migration
If auto-migration doesn't work:
```bash
# Run migrations manually
pnpm docker:migrate

# Restart
pnpm docker:restart
```

## Changes Made

### Files Modified:
1. **src/components/pages/settings/parts/SettingsGenerators/generators/shell.tsx**
   - Removed manual Content-Type header for file uploads

2. **src/components/pages/settings/parts/SettingsGenerators/generators/flameshot.tsx**
   - Removed manual Content-Type header for file uploads

3. **src/lib/fs.ts**
   - Added try-catch for `decodeURIComponent` to handle non-encoded filenames

4. **src/lib/uploader/formatFileName.ts**
   - Added safety check for empty parsed filenames

5. **src/lib/random.ts**
   - Added validation for invalid length parameter

6. **src/lib/api/upload.ts**
   - Enhanced error logging with detailed context

7. **src/server/routes/api/upload/index.ts**
   - Improved error logging for multipart parsing failures

8. **src/server/startup/plugins.ts**
   - Added explicit multipart configuration options

9. **src/lib/db/migration/index.ts**
   - Improved logging (changed debug to info)
   - Better error messages with stack traces
   - Clear success/failure messages

10. **docker-compose.yml**
    - Made `POSTGRESQL_PASSWORD` optional with default value `zipline`
    - Ensures CI/CD compatibility

11. **package.json**
    - Kept local development scripts (`build`, `dev`, etc.)
    - Added Docker-specific scripts (`docker:start`, `docker:logs`, etc.)
    - Fixed build workflow compatibility

### Files Created:
1. **UPLOAD_FIX.md** - Detailed explanation of the multipart boundary fix
2. **docker-helper.md** - Quick reference for Docker commands

## Script Reference

### Docker Operations:
- `pnpm docker:start` - Start containers
- `pnpm docker:stop` - Stop containers
- `pnpm docker:restart` - Restart Zipline service
- `pnpm docker:logs` - View logs
- `pnpm docker:migrate` - Run migrations manually
- `pnpm docker:shell` - Get a shell inside container
- `pnpm docker:build` - Build images

### Local Development:
- `pnpm build` - Build locally
- `pnpm dev` - Run dev server
- `pnpm start` - Run production server
- `pnpm db:migrate` - Create migration

## Key Takeaways

1. **Never manually set Content-Type for multipart uploads** - Let the tool (curl, browser) do it automatically
2. **Auto-migration runs on every server start** - Check logs to verify it succeeded
3. **Database schema must be up-to-date** - Missing columns will cause upload failures
4. **Use docker:* commands for Docker operations** - Regular commands are for local development

## Testing

After applying these fixes:

1. Restart your container:
   ```bash
   pnpm docker:restart
   ```

2. Check migrations ran:
   ```bash
   pnpm docker:logs | grep migrations
   ```

3. Try uploading a file through the web interface

4. Should work without errors! 🎉
