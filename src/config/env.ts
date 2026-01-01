/**
 * Environment Configuration
 * Uses Zod for validation and dotenv for loading environment variables
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define the environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  CORS_ALLOWED_ORIGINS: z.string().optional().transform((val) => 
    val ? val.split(',').map(origin => origin.trim()) : undefined
  ),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Log environment status (without sensitive data)
console.log('🔧 Environment Configuration:');
console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
console.log(`  - PORT: ${env.PORT}`);
console.log(`  - SUPABASE_URL: ${env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET'}`);
