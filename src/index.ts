/**
 * TikTok Image Upload Service
 * TypeScript Express server that handles TikTok image uploads with Supabase integration
 */

import express, { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import { Database, Tables, TablesUpdate } from './types/supabase';
import { TiktokUploadResponse } from './types/tiktok';
import { env } from './config/env';

const app = express();
const PORT = env.PORT;

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Default allowed origins
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'https://your-frontend-domain.com', // Replace with your actual frontend domain
    ];
    
    // Use environment variable if set, otherwise use defaults
    const allowedOrigins = env.CORS_ALLOWED_ORIGINS || defaultOrigins;
    
    // Allow all origins in development, restrict in production
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
// Increase body parser limits to handle file uploads (default is 100kb which is too small)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed') as any;
      cb(error, false);
    }
  }
});

// Initialize Supabase client
const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'tiktok-upload-service',
    environment: env.NODE_ENV,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'TikTok Upload Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: '/api/upload/tiktok'
    }
  });
});

// TikTok upload endpoint
app.post('/api/upload/tiktok', upload.single('file'), async (req: Request, res: Response) => {
  let account: Tables<'tiktok_accounts'> | null = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: true,
        url: req.url,
        statusCode: 400,
        statusMessage: 'No file provided',
        message: 'No file provided'
      });
    }

    console.log('Starting TikTok upload process...');
    console.log('File info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get TikTok account with lowest upload count
    const { data: accountData, error: accountError } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .eq('status', 'active')
      .not('csrftoken', 'is', null)
      .not('sid_guard_ads', 'is', null)
      .order('upload_count', { ascending: true })
      .limit(1)
      .single();

    if (accountError || !accountData) {
      console.error('Account error:', accountError);
      return res.status(500).json({
        error: true,
        url: req.url,
        statusCode: 500,
        statusMessage: 'No active TikTok account available',
        message: 'No active TikTok account available',
        accountError: accountError?.message || 'No account found'
      });
    }

    account = accountData;
    console.log('Using account:', account.name, 'Upload count:', account.upload_count);

    // Prepare TikTok upload request
    const tiktokFormData = new FormData();
    tiktokFormData.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    tiktokFormData.append('source', '0');

    // Prepare headers for TikTok API
    const headers: Record<string, string> = {
      'tt-csrf-token': account.csrftoken!,
      'Cookie': `tt_csrf_token=${account.csrftoken}; sid_guard=${account.sid_guard_ads}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Host': 'www.tiktok.com',
    };

    console.log('Making request to TikTok API...');
    console.log('Headers:', {
      'tt-csrf-token': account.csrftoken,
      'Cookie': `tt_csrf_token=${account.csrftoken}; sid_guard=${account.sid_guard_ads}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });

    // Make request to TikTok API
    const tiktokApiUrl = 'https://www.tiktok.com/api/upload/image/';
    const response = await fetch(tiktokApiUrl, {
      method: 'POST',
      body: tiktokFormData,
      headers
    });

    console.log('TikTok API response status:', response.status, response.statusText);

    let responseBody: unknown = null;
    try {
      responseBody = await response.json();
      console.log('TikTok API response body:', responseBody);
    } catch {
      try {
        responseBody = await response.text();
        console.log('TikTok API response text:', responseBody);
      } catch {
        responseBody = 'Unable to parse response';
        console.log('Unable to parse TikTok response');
      }
    }

    if (!response.ok) {
      console.error('TikTok API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: true,
        url: req.url,
        statusCode: response.status,
        statusMessage: `TikTok API error: ${response.statusText}`,
        message: `TikTok API error: ${response.statusText}`,
        accountInfo: account ? {
          id: account.id,
          name: account.name,
          status: account.status || 'unknown',
          uploadCount: account.upload_count || 0,
          lastUploadAt: account.last_upload_at,
          cooldownUntil: account.cooldown_until
        } : undefined,
        tiktokApiResponse: {
          statusCode: response.status,
          statusMessage: response.statusText,
          responseBody
        },
        requestDetails: {
          url: tiktokApiUrl,
          method: 'POST',
          headers: {
            'tt-csrf-token': account?.csrftoken || 'missing',
            'Cookie': `tt_csrf_token=${account?.csrftoken || 'missing'}; sid_guard=${account?.sid_guard_ads || 'missing'}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Host': 'www.tiktok.com'
          }
        }
      });
    }

    const result = responseBody as TiktokUploadResponse;

    // Check if upload was successful
    if (result.status_code === 0 && result.data?.uri) {
      console.log('Upload successful! URI:', result.data.uri);
      
      // Update account upload count
      const updateData: TablesUpdate<'tiktok_accounts'> = {
        upload_count: (account.upload_count || 0) + 1,
        last_upload_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('tiktok_accounts')
        .update(updateData)
        .eq('id', account.id);

      // Construct the final URL
      const finalUrl = `https://p16-sg.tiktokcdn.com/obj/${result.data.uri}`;
      console.log('Final URL:', finalUrl);

      return res.json({
        success: true,
        url: finalUrl,
        accountUsed: account.name
      });
    } else {
      console.error('TikTok upload failed:', result);
      return res.status(400).json({
        error: true,
        url: req.url,
        statusCode: 400,
        statusMessage: result.status_msg || 'TikTok upload failed',
        message: result.status_msg || 'TikTok upload failed',
        accountInfo: account ? {
          id: account.id,
          name: account.name,
          status: account.status || 'unknown',
          uploadCount: account.upload_count || 0,
          lastUploadAt: account.last_upload_at,
          cooldownUntil: account.cooldown_until
        } : undefined,
        tiktokApiResponse: {
          statusCode: result.status_code,
          statusMessage: result.status_msg || 'Unknown error',
          responseBody: result
        },
        requestDetails: {
          url: tiktokApiUrl,
          method: 'POST',
          headers: {
            'tt-csrf-token': account?.csrftoken || 'missing',
            'Cookie': `tt_csrf_token=${account?.csrftoken || 'missing'}; sid_guard=${account?.sid_guard_ads || 'missing'}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Host': 'www.tiktok.com'
          }
        }
      });
    }
  } catch (error) {
    console.error('TikTok upload error:', error);
    
    return res.status(500).json({
      error: true,
      url: req.url,
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Upload failed',
      message: error instanceof Error ? error.message : 'Upload failed',
      accountInfo: account ? {
        id: account.id,
        name: account.name,
        status: account.status || 'unknown',
        uploadCount: account.upload_count || 0,
        lastUploadAt: account.last_upload_at,
        cooldownUntil: account.cooldown_until
      } : undefined,
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
  }
});

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  return res.status(500).json({
    error: true,
    message: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TikTok Upload Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload/tiktok`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});
