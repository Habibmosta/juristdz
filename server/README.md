# JuristDZ Multi-Role Legal Platform - Backend Server

## Overview

This is the backend server for the JuristDZ Multi-Role Legal Platform, built with TypeScript, Node.js, Express, and PostgreSQL. The platform supports multiple legal professional roles including lawyers, notaries, bailiffs, magistrates, law students, corporate lawyers, and administrators.

## Architecture

The server follows a modular architecture with the following structure:

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── database/        # Database connection, migrations, seeds
├── middleware/      # Express middleware
├── models/          # Data models and types
├── routes/          # API route definitions
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── test/            # Test files and setup
```

## Features

- **Multi-Role Authentication**: Support for 7 different legal professional roles
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Document Management**: Secure document storage and versioning
- **Legal Search**: Full-text search in jurisprudence and legal texts
- **Multi-Tenant Architecture**: Data isolation between organizations
- **Audit Logging**: Complete audit trail for all operations
- **Multi-Language Support**: French and Arabic language support

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (for development)

## Quick Start with Docker

1. **Clone the repository and navigate to the server directory**
   ```bash
   cd server
   ```

2. **Copy environment variables**
   ```bash
   cp ../.env.example ../.env
   ```

3. **Update the .env file with your API keys**
   ```bash
   # Edit the .env file and add your API keys
   GEMINI_API_KEY=your-gemini-api-key-here
   GROQ_API_KEY=your-groq-api-key-here
   ```

4. **Start all services with Docker Compose**
   ```bash
   cd ..
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   docker-compose exec server npm run db:migrate
   ```

6. **Access the services**
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5173
   - Database: localhost:5432
   - Redis: localhost:6379
   - MailHog (Email testing): http://localhost:8025
   - Elasticsearch: http://localhost:9200

## Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure it:

```bash
cp ../.env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens (min 32 characters)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (min 32 characters)
- `ENCRYPTION_KEY`: 32-character key for data encryption
- `GEMINI_API_KEY`: Google Gemini API key
- `GROQ_API_KEY`: Groq API key

### 3. Database Setup

Start PostgreSQL and Redis, then run migrations:

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (drop and recreate)

## API Documentation

### Health Check
- `GET /health` - Server health status

### Authentication (Placeholder)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users (Placeholder)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Documents (Placeholder)
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document

### Search (Placeholder)
- `GET /api/search/jurisprudence` - Search jurisprudence
- `GET /api/search/legal-texts` - Search legal texts

### Billing (Placeholder)
- `POST /api/billing/calculate-fees` - Calculate fees
- `POST /api/billing/generate-invoice` - Generate invoice

### Admin (Placeholder)
- `GET /api/admin/users` - Manage users
- `GET /api/admin/statistics` - View statistics

## Database Schema

The database includes the following main tables:

- `users` - User accounts
- `user_profiles` - Professional profiles for each role
- `organizations` - Legal organizations (bars, courts, etc.)
- `user_sessions` - Active user sessions
- `documents` - Document storage and metadata
- `document_versions` - Document version history
- `legal_codes` - Algerian legal codes
- `legal_articles` - Individual legal articles
- `jora_publications` - Official journal publications
- `jurisprudence_cases` - Court decisions and jurisprudence
- `courts` - Court information

## Testing

The project uses Jest for testing with the following setup:

- Unit tests for individual functions and classes
- Integration tests for API endpoints
- Property-based tests using fast-check
- Test coverage reporting

Run tests:
```bash
npm test
```

## Code Quality

The project enforces code quality through:

- **ESLint**: TypeScript and JavaScript linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Jest**: Testing framework
- **Husky**: Git hooks (when configured)

## Security Features

- JWT-based authentication with refresh tokens
- Multi-factor authentication support
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Rate limiting
- Input validation with Joi
- SQL injection prevention
- XSS protection with Helmet
- CORS configuration

## Monitoring and Logging

- Winston for structured logging
- Request/response logging
- Error tracking and reporting
- Health check endpoints
- Performance monitoring

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Production

```bash
docker build -t juristdz-server .
docker run -p 3000:3000 juristdz-server
```

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commit messages
5. Ensure all tests pass before submitting

## License

This project is licensed under the MIT License.