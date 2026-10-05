#!/bin/bash

echo "🔨 Rebuilding Zipline with all fixes..."
echo ""

# Stop containers
echo "⏹️  Stopping containers..."
docker compose down

# Build with no cache to ensure all changes are included
echo "🏗️  Building Docker image (this may take a few minutes)..."
docker compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait a bit for startup
echo "⏳ Waiting for services to start..."
sleep 5

# Show logs
echo "📋 Showing logs (press Ctrl+C to exit)..."
echo "    Look for: [entrypoint] Running database migrations..."
echo ""
docker compose logs -f zipline
