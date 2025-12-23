# Postiz API Wrapper

A standardized REST API wrapper for the Postiz social media scheduling service, providing clean endpoints for social media scheduling, content management, and analytics integration with the TuriX ecosystem.

## Features

- **Social Media Scheduling**: Schedule posts across multiple platforms (Twitter, Instagram, Facebook, LinkedIn, YouTube, TikTok, Pinterest, Discord, Mastodon, Bluesky)
- **Content Management**: Create, update, delete, and manage social media content
- **Analytics Integration**: Retrieve performance metrics and engagement data
- **Platform Integration**: Connect and manage social media platform integrations
- **AI Content Enhancement**: Generate and enhance content using AI
- **Bulk Operations**: Schedule multiple posts at once
- **RESTful API**: Clean, documented REST endpoints with OpenAPI/Swagger
- **Authentication**: JWT and API key authentication support
- **Rate Limiting**: Built-in rate limiting and request throttling
- **Health Monitoring**: Comprehensive health checks and metrics
- **Error Handling**: Robust error handling and validation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TuriX App     │────│ Postiz API Wrapper │────│ Postiz Service  │
│                 │    │                    │    │                 │
│ - React UI      │    │ - Express Server  │    │ - Social Media  │
│ - API Client    │    │ - REST Endpoints  │    │ - Scheduling     │
│ - State Mgmt    │    │ - Auth & Security │    │ - Analytics      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Postiz service running (default: http://localhost:3000)
- Redis (optional, for caching)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd postiz-api-wrapper

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure environment variables
nano .env
```

### Configuration

Edit `.env` file with your configuration:

```env
# Server
PORT=3001
NODE_ENV=development

# Postiz API
POSTIZ_API_URL=http://localhost:3000
POSTIZ_API_KEY=your_api_key
POSTIZ_USERNAME=your_username
POSTIZ_PASSWORD=your_password

# Security
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Running the Service

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Production with PM2
npm install -g pm2
pm2 start dist/main.js --name postiz-api-wrapper
```

## API Documentation

### Authentication

The API supports two authentication methods:

1. **JWT Bearer Token**
   ```
   Authorization: Bearer <jwt_token>
   ```

2. **API Key**
   ```
   X-API-Key: <api_key>
   ```

### Endpoints

#### Posts API

- `POST /api/v1/posts` - Create a new post
- `GET /api/v1/posts` - Get posts with pagination and filters
- `GET /api/v1/posts/:id` - Get a specific post
- `PUT /api/v1/posts/:id` - Update a post
- `DELETE /api/v1/posts/:id` - Delete a post

#### Analytics API

- `GET /api/v1/analytics` - Get analytics data
- `GET /api/v1/analytics/posts/:postId` - Get post-specific analytics
- `GET /api/v1/analytics/summary` - Get analytics summary

#### Integrations API

- `GET /api/v1/integrations` - Get connected integrations
- `GET /api/v1/integrations/platforms` - Get available platforms
- `GET /api/v1/integrations/connect/:platform` - Get authorization URL
- `POST /api/v1/integrations/connect` - Connect a platform
- `DELETE /api/v1/integrations/:id` - Disconnect an integration
- `GET /api/v1/integrations/:id/status` - Get integration status

#### Health API

- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness check
- `GET /api/health/metrics` - Service metrics

### Example Usage

#### Create a Post

```bash
curl -X POST http://localhost:3001/api/v1/posts \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, world! #socialmedia",
    "platforms": ["twitter", "linkedin"],
    "scheduledAt": "2024-01-15T10:00:00Z",
    "tags": ["marketing", "announcement"]
  }'
```

#### Get Analytics

```bash
curl -X GET "http://localhost:3001/api/v1/analytics?platforms=twitter,linkedin&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer your_jwt_token"
```

#### Connect Integration

```bash
curl -X POST http://localhost:3001/api/v1/integrations/connect \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "code": "oauth_authorization_code",
    "state": "oauth_state"
  }'
```

## Development

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route handlers
├── dto/             # Data transfer objects
├── middleware/      # Express middleware
├── services/        # Business logic services
├── utils/           # Utility functions
└── main.ts          # Application entry point
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run specific test
npm test -- --testNamePattern="PostController"
```

## Docker Deployment

### Build Image

```bash
docker build -t postiz-api-wrapper .
```

### Run Container

```bash
docker run -d \
  --name postiz-api-wrapper \
  -p 3001:3001 \
  -e POSTIZ_API_URL=http://host.docker.internal:3000 \
  -e JWT_SECRET=your_secret \
  postiz-api-wrapper
```

### Docker Compose

```yaml
version: '3.8'
services:
  postiz-api-wrapper:
    build: .
    ports:
      - "3001:3001"
    environment:
      - POSTIZ_API_URL=http://postiz-app:3000
      - JWT_SECRET=your_secret
    depends_on:
      - postiz-app
```

## Monitoring & Logging

### Health Checks

The service provides comprehensive health monitoring:

- **Health Check**: `GET /api/health` - Overall service health
- **Readiness Check**: `GET /api/health/ready` - Service readiness
- **Metrics**: `GET /api/health/metrics` - Detailed metrics

### Logging

Structured logging with Winston:

- Console logging for development
- File logging for production (`logs/error.log`, `logs/combined.log`)
- Configurable log levels
- Request/response logging

## Security

### Authentication & Authorization

- JWT token-based authentication
- API key authentication
- Request rate limiting
- CORS protection
- Input validation and sanitization

### Best Practices

- All endpoints require authentication
- Input validation using express-validator
- SQL injection prevention
- XSS protection
- Secure headers with Helmet

## Performance

### Optimizations

- Request compression
- Response caching (Redis)
- Connection pooling
- Rate limiting
- Request timeouts

### Scalability

- Stateless design
- Horizontal scaling support
- Database connection pooling
- Redis for session/cache storage

## API Versioning

The API uses URL-based versioning:

- Current version: `v1`
- Future versions: `v2`, `v3`, etc.
- Breaking changes increment major version
- Backward compatibility maintained within major version

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Validation error details"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure code quality (`npm run lint`)
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: Visit `/api-docs` when running the service
- **Issues**: Create issues on GitHub
- **Discussions**: Use GitHub Discussions for questions

## Changelog

### v1.0.0
- Initial release
- Basic CRUD operations for posts
- Analytics integration
- Social media platform integrations
- Health monitoring
- API documentation