import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // CORS
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
  
  // File Storage
  UPLOAD_MAX_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_ALLOWED_TYPES: Joi.string().default('pdf,doc,docx,txt'),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  
  // Encryption
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // External APIs
  GEMINI_API_KEY: Joi.string().required(),
  GROQ_API_KEY: Joi.string().required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  server: {
    port: envVars.PORT
  },
  database: {
    url: envVars.DATABASE_URL,
    ssl: envVars.DATABASE_SSL
  },
  redis: {
    url: envVars.REDIS_URL
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN
  },
  cors: {
    allowedOrigins: envVars.CORS_ALLOWED_ORIGINS.split(',')
  },
  upload: {
    maxSize: envVars.UPLOAD_MAX_SIZE,
    allowedTypes: envVars.UPLOAD_ALLOWED_TYPES.split(',')
  },
  email: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS
  },
  encryption: {
    key: envVars.ENCRYPTION_KEY
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
  },
  logging: {
    level: envVars.LOG_LEVEL
  },
  apis: {
    gemini: envVars.GEMINI_API_KEY,
    groq: envVars.GROQ_API_KEY
  }
};