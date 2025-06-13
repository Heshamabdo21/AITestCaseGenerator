# Docker Deployment Guide

Complete deployment guide for the Test Case Management System using Docker with the latest architecture updates.

## Quick Start

### Option 1: Docker Compose (Recommended)
Run the complete application stack with PostgreSQL database:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

The application will be available at http://localhost:5000

### Option 2: Standalone Docker Container
Build and run just the application container with memory storage:

```bash
# Build the image
docker build -t test-case-manager .

# Run with memory storage
docker run -p 5000:5000 test-case-manager

# Run with environment variables
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e OPENAI_API_KEY=your_openai_key \
  test-case-manager
```

## Architecture & Configuration

### Current Build Process
The Dockerfile uses a multi-stage build optimized for the latest project structure:

1. **Builder Stage**: Installs all dependencies and builds both frontend (Vite) and backend (ESBuild)
2. **Production Stage**: Copies only production dependencies and built assets
3. **Runtime**: Executes as non-root user with comprehensive health checks

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `production` |
| `DATABASE_URL` | PostgreSQL connection string | No | Memory storage |
| `OPENAI_API_KEY` | OpenAI API key for AI assistant features | No | AI features disabled |
| `PORT` | Application port | No | `5000` |
| `HOST` | Bind address | No | `0.0.0.0` |

### Storage Options
- **Memory Storage** (default): No database required, data persists during container lifetime
- **PostgreSQL**: Full persistence with automatic table creation and migrations

## Docker Compose Services

### Application Stack
- **app**: Main Node.js application server
  - Built from local Dockerfile
  - Exposes port 5000
  - Includes health checks
  - Runs as non-root user

- **db**: PostgreSQL 15 database
  - Official PostgreSQL image
  - Persistent volume for data
  - Environment-based configuration
  - Only exposed in development

### Service Dependencies
The application container waits for the database to be ready before starting when using PostgreSQL.

## Health Monitoring

### Application Health Check
- **Endpoint**: Checks `/api/health`
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 30 seconds (allows for initialization)
- **Retries**: 3 attempts before marking unhealthy

### AI Features Status
- **Without API Key**: AI assistant displays helpful error messages
- **With API Key**: Full AI functionality including code suggestions and test analysis
- **Graceful Degradation**: Application remains fully functional without AI features

### Database Health
PostgreSQL includes built-in health checks and automatic restart policies.

## Security Features

### Container Security
- **Multi-stage build**: Minimizes final image size and attack surface
- **Non-root execution**: Application runs as user `testapp` (UID 1001)
- **Alpine Linux base**: Minimal, security-focused base image
- **Production dependencies only**: No development tools in final image

### Application Security
- **Input validation**: Zod schema validation on all inputs
- **File upload restrictions**: Size limits and type validation
- **Environment isolation**: Proper secret management
- **SQL injection prevention**: Parameterized queries via Drizzle ORM

## Data Persistence

### Volumes
- `postgres_data`: PostgreSQL database files
- `app_uploads`: User-uploaded CSV files and assets

### Backup Strategy
```bash
# Backup database
docker-compose exec db pg_dump -U testuser testcases > backup.sql

# Restore database
docker-compose exec -T db psql -U testuser testcases < backup.sql
```

## Development vs Production

### Development Mode
```bash
# Use docker-compose.override.yml for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production Deployment
```bash
# Production with external database and AI features
docker run -d \
  --name test-case-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@prod-db:5432/testcases \
  -e OPENAI_API_KEY=sk-your-openai-api-key-here \
  --restart unless-stopped \
  test-case-manager

# Production without AI features (memory storage)
docker run -d \
  --name test-case-manager \
  -p 5000:5000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  test-case-manager
```

## Troubleshooting

### Common Issues
1. **Container won't start**: Check logs with `docker-compose logs app`
2. **Database connection**: Verify `DATABASE_URL` format and network connectivity
3. **Port conflicts**: Ensure port 5000 is available or change mapping
4. **Permission issues**: Verify volume permissions for non-root user

### Debugging Commands
```bash
# View detailed logs
docker-compose logs -f --tail=100 app

# Access container shell
docker-compose exec app sh

# Check container health
docker inspect <container_id> | grep Health

# Monitor resource usage
docker stats
```

## Scaling & Performance

### Horizontal Scaling
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Use load balancer (nginx, traefik, etc.)
```

### Resource Limits
```yaml
# In docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Maintenance

### Updates
```bash
# Update application
docker-compose pull
docker-compose up -d --build

# Clean old images
docker image prune -f
```

### Monitoring
- Container health status via Docker health checks
- Application metrics via built-in endpoints
- Database performance monitoring
- Log aggregation for production deployments