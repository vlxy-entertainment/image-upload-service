# Docker Deployment Guide

Quick reference guide for deploying the TikTok Upload Service with Docker.

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0

## Quick Deployment

```bash
# 1. Clone repository
git clone <your-repo-url>
cd tiktok-upload-service

# 2. Create .env file
cp env.example .env
nano .env  # Edit with your values

# 3. Build and start
docker-compose up -d --build

# 4. Check logs
docker-compose logs -f

# 5. Test health endpoint
curl http://localhost:3000/health
```

## Environment Variables

Make sure your `.env` file contains:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services (use this after changing .env file)
docker-compose restart

# Or use the restart script
./restart.sh

# Rebuild and restart (only needed when code changes)
docker-compose up -d --build

# Check container status
docker-compose ps

# Execute command in container
docker-compose exec tiktok-upload-service sh
```

## Updating Environment Variables

**Important**: After changing the `.env` file, you must restart the container for changes to take effect:

```bash
# Option 1: Use the restart script (recommended)
./restart.sh

# Option 2: Manual restart
docker-compose restart

# Option 3: Stop and start
docker-compose down
docker-compose up -d
```

**Note**: Changing `.env` does NOT require rebuilding the image. Only restart the container.

## Troubleshooting

### Environment variables not updating after changing .env

**Solution**: Restart the container after changing `.env`:
```bash
docker-compose restart
# or
./restart.sh
```

Docker containers don't automatically reload environment variables. You must restart the container for changes to take effect.

### Container won't start
```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose config

# Verify .env file exists and has correct values
cat .env
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Build fails
```bash
# Clean build
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (nginx/traefik)
2. **Set up SSL/TLS** certificates
3. **Configure firewall** rules
4. **Set up log rotation**
5. **Use Docker secrets** for sensitive data
6. **Monitor container health**

## Health Check

The container includes a health check. Monitor it with:

```bash
docker inspect --format='{{.State.Health.Status}}' tiktok-upload-service
```

Or use the HTTP endpoint:

```bash
curl http://localhost:3000/health
```

