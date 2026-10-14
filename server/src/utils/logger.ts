import winston from 'winston';
import { config } from '@/config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Environnement serverless (Vercel) : filesystem read-only.
// Le transport File de Winston tente mkdirSync('logs') à sa construction,
// ce qui fait échouer le démarrage (ENOENT) : on n'utilise que la console.
const isServerless = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: !isServerless }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [];

if (!isServerless) {
  // Écriture fichier uniquement hors serverless
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Console : toujours (en dev pour l'affichage, en serverless/plateforme
// pour la capture des logs par la plateforme)
transports.push(new winston.transports.Console({ format: consoleFormat }));

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'juristdz-server' },
  transports,
});
