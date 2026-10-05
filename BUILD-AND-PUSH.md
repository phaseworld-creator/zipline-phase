# Build and Push Fixed Image to GHCR

## What You Need to Do

Since users pull `ghcr.io/phaseworld-creator/zipline-phase:latest`, you need to build and push the fixed image.

## Steps

### 1. Build the Image Locally

```bash
cd ~/zipline
docker build -t ghcr.io/phaseworld-creator/zipline-phase:latest .
```

### 2. Login to GitHub Container Registry

```bash
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u phaseworld-creator --password-stdin
```

(Replace `YOUR_GITHUB_TOKEN` with your GitHub Personal Access Token with `write:packages` permission)

### 3. Push the Fixed Image

```bash
docker push ghcr.io/phaseworld-creator/zipline-phase:latest
```

### 4. Tag it as a Version (Optional but Recommended)

```bash
docker tag ghcr.io/phaseworld-creator/zipline-phase:latest ghcr.io/phaseworld-creator/zipline-phase:4.7.0-fixed
docker push ghcr.io/phaseworld-creator/zipline-phase:4.7.0-fixed
```

## After Pushing

Users can now just:

```bash
docker compose pull
docker compose down
docker compose up -d
```

And it will work! The entrypoint will automatically fix the database.

## What's Fixed in the Image

1. ✅ Entrypoint runs migrations on startup
2. ✅ If migration fails, it adds the `encrypted` column directly  
3. ✅ Includes postgresql-client for database fixes
4. ✅ All multipart/upload fixes included
5. ✅ Better error logging

## Alternative: Use GitHub Actions

If you have GitHub Actions set up, just push the code and let it build automatically:

```bash
git add .
git commit -m "fix: add auto-migration and database fixes"
git push
```

Your `.github/workflows/docker-release.yml` should build and push automatically.
