# TikTok Upload Service

A TypeScript Express server that handles TikTok image uploads with Supabase integration.

## Features

- ✅ **TypeScript** with full type safety
- ✅ **Express.js** with multer for file uploads
- ✅ **Supabase integration** for account management
- ✅ **Comprehensive error logging** with detailed responses
- ✅ **CORS support** for web applications

## Prerequisites

- Node.js 24.10.0 (for local development)
- npm or pnpm (for local development)
- Docker and Docker Compose (for Docker deployment)
- Supabase account with configured database

## Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd tiktok-upload-service
```

### 2. Install dependencies
```bash
npm install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` and add your configuration:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production/test) | No |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins | No |

## Development

### Local Development
```bash
# Run in development mode
npm run dev

# Run with watch mode (auto-restart on changes)
npm run dev:watch

# Build TypeScript
npm run build

# Start production build
npm start
```

### Testing Upload
```bash
curl -X POST \
  http://localhost:3000/api/upload/tiktok \
  -F "file=@test.png"
```

## API Endpoints

### Health Check
```
GET /health
```

### Upload Image to TikTok
```
POST /api/upload/tiktok
Content-Type: multipart/form-data
Body: FormData with 'file' field
```

**Success Response:**
```json
{
  "success": true,
  "url": "https://p16-sg.tiktokcdn.com/obj/...",
  "accountUsed": "tiktok-account-name"
}
```

**Error Response:**
```json
{
  "error": true,
  "url": "/api/upload/tiktok",
  "statusCode": 400,
  "statusMessage": "Permission Denied",
  "message": "Permission Denied",
  "accountInfo": {
    "id": "account-id",
    "name": "account-name",
    "status": "active",
    "uploadCount": 5,
    "lastUploadAt": "2024-01-01T00:00:00Z",
    "cooldownUntil": null
  },
  "tiktokApiResponse": {
    "statusCode": 7,
    "statusMessage": "Permission Denied",
    "responseBody": { /* TikTok's actual response */ }
  }
}
```

## Project Structure

```
tiktok-upload-service/
├── src/
│   ├── index.ts              # Main Express server
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   └── types/
│       ├── tiktok.ts         # TikTok type definitions
│       └── supabase.ts       # Supabase type definitions
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose configuration
├── .dockerignore            # Docker ignore file
├── env.example              # Environment variables example
└── README.md                # This file
```

## Docker Deployment

This project includes Docker configuration for easy deployment on any server with Docker installed.

### Prerequisites for Docker

- Docker >= 20.10
- Docker Compose >= 2.0 (optional, for docker-compose)

### Quick Start with Docker

1. **Clone and navigate to the project**
```bash
git clone <your-repo-url>
cd tiktok-upload-service
```

2. **Create `.env` file**
```bash
cp env.example .env
# Edit .env with your actual values
```

3. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

The service will be available at `http://localhost:3000`

### Docker Commands

#### Build the Docker image
```bash
docker build -t tiktok-upload-service .
```

#### Run the container
```bash
docker run -d \
  --name tiktok-upload-service \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  tiktok-upload-service
```

#### Using Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart (when code changes)
docker-compose up -d --build

# Recreate container (when .env changes)
docker-compose up -d --force-recreate

# Rebuild and recreate (when both code and .env change)
docker-compose up -d --build --force-recreate
```

#### View logs
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f tiktok-upload-service
```

#### Stop the container
```bash
# Docker Compose
docker-compose down

# Docker
docker stop tiktok-upload-service
docker rm tiktok-upload-service
```

### Docker Image Features

- **Multi-stage build**: Optimized image size
- **Non-root user**: Runs as `nodejs` user for security
- **Health checks**: Built-in health check endpoint
- **Production-ready**: Only production dependencies included
- **Alpine Linux**: Lightweight base image

### Environment Variables in Docker

You can pass environment variables in several ways:

1. **Using `.env` file** (recommended)
```bash
docker-compose up -d
```

2. **Using command line**
```bash
docker run -d \
  -p 3000:3000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  tiktok-upload-service
```

3. **Using environment file**
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  tiktok-upload-service
```

### Deploying on Ubuntu Server

1. **Install Docker** (if not already installed)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

2. **Clone the repository**
```bash
git clone <your-repo-url>
cd tiktok-upload-service
```

3. **Set up environment variables**
```bash
cp env.example .env
nano .env  # Edit with your values
```

4. **Build and start**
```bash
docker-compose up -d --build
```

5. **Check status**
```bash
docker-compose ps
docker-compose logs -f
```

6. **Test the service**
```bash
curl http://localhost:3000/health
```

### Production Deployment Tips

- **Use a reverse proxy** (nginx/traefik) in front of the container
- **Set up SSL/TLS** certificates (Let's Encrypt)
- **Configure firewall** to only expose necessary ports
- **Set up log rotation** for Docker logs
- **Use Docker secrets** for sensitive data in production
- **Monitor container health** using the `/health` endpoint

### Other Deployment Options

This is a standard Node.js application that can also be deployed to:

- **Heroku**: Use the Node.js buildpack
- **DigitalOcean App Platform**: Configure as a Node.js app
- **AWS Elastic Beanstalk**: Deploy as a Node.js application
- **Google Cloud Run**: Use the Node.js runtime
- **Azure App Service**: Configure as a Node.js app
- **VPS**: Run directly on a virtual private server

## Troubleshooting

### TikTok Still Blocking?

1. **Check Account Status**: Ensure your TikTok accounts in Supabase are active
2. **Verify Tokens**: Make sure csrftoken and sid_guard_ads are valid
3. **Use Proxy**: Consider using a proxy service if needed
4. **Rotate Accounts**: The service automatically uses accounts with lowest upload count

### TypeScript Build Issues?

1. **Check tsconfig.json**: Ensure TypeScript configuration is correct
2. **Run Build**: Make sure `npm run build` completes successfully
3. **Check Dependencies**: Ensure all TypeScript dependencies are installed

### File Upload Issues?

1. **Check File Size**: Maximum 10MB per file
2. **Check File Type**: Only image files are accepted
3. **Check CORS**: Ensure your frontend is configured for CORS

### Environment Variables Not Working?

1. **Check .env File**: Verify variables are set correctly
2. **Restart Server**: Sometimes you need to restart after setting variables
3. **Check Logs**: Look at console output for validation errors

## Monitoring

- **Health Check**: Use `/health` endpoint for monitoring
- **Logs**: Check console output for detailed error messages
- **Error Responses**: All errors include detailed information for debugging

## License

ISC
