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

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Check container status
docker-compose ps

# Execute command in container
docker-compose exec tiktok-upload-service sh
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose config
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

