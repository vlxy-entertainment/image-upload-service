# TikTok Upload Service

A TypeScript Express server that handles TikTok image uploads with Supabase integration.

## Features

- ✅ **TypeScript** with full type safety
- ✅ **Express.js** with multer for file uploads
- ✅ **Supabase integration** for account management
- ✅ **Comprehensive error logging** with detailed responses
- ✅ **CORS support** for web applications

## Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
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
├── env.example               # Environment variables example
└── README.md                 # This file
```

## Deployment

This is a standard Node.js application that can be deployed to any platform that supports Node.js:

- **Heroku**: Use the Node.js buildpack
- **DigitalOcean App Platform**: Configure as a Node.js app
- **AWS Elastic Beanstalk**: Deploy as a Node.js application
- **Google Cloud Run**: Use the Node.js runtime
- **Azure App Service**: Configure as a Node.js app
- **Docker**: Create a Dockerfile and deploy to any container platform
- **VPS**: Run directly on a virtual private server

### Example Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

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
