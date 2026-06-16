#!/bin/bash
# Script to restart Docker container after .env changes

echo "🔄 Restarting TikTok Upload Service..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create .env file from env.example"
    exit 1
fi

# Recreate the container to pick up new environment variables
# This ensures environment variables are reloaded
echo "📦 Recreating container with new environment variables..."
docker-compose up -d --force-recreate

# Wait a moment for container to start
sleep 2

# Check if container is running
if docker ps | grep -q tiktok-upload-service; then
    echo "✅ Container recreated successfully!"
    echo ""
    echo "📊 View logs with: docker-compose logs -f"
    echo "🏥 Health check: curl http://localhost:3003/health"
else
    echo "❌ Container failed to start. Check logs:"
    echo "   docker-compose logs"
    exit 1
fi

