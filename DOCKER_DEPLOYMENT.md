# Docker Deployment Guide

This guide explains how to deploy the Azure DevOps Test Case Management application using Docker.

## Quick Start

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Open your browser to `http://localhost:5000`
   - The application will be running with memory storage

3. **Check container status:**
   ```bash
   docker-compose ps
   docker-compose logs app
   ```

## Manual Docker Commands

If you prefer to use Docker directly instead of Docker Compose:

1. **Build the image:**
   ```bash
   docker build -t azure-testcase-manager .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name azure-testcase-app \
     -p 5000:5000 \
     -v $(pwd)/uploads:/app/uploads \
     azure-testcase-manager
   ```

## PostgreSQL Database Persistence

### Option 1: Using Docker Compose (Recommended)

The `docker-compose.yml` file includes PostgreSQL persistence by default:

```bash
# Start with PostgreSQL persistence
docker-compose up -d

# View database logs
docker-compose logs postgres

# Connect to database directly
docker-compose exec postgres psql -U postgres -d testcase_db
```

### Option 2: External PostgreSQL Database

To use an external PostgreSQL database, update the app service environment:

```yaml
environment:
  - DATABASE_URL=postgresql://username:password@your-host:5432/your-database
```

### Option 3: Memory Storage Only

To run without database persistence, remove the DATABASE_URL environment variable:

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  # Remove DATABASE_URL for memory storage
```

## Environment Variables

The application supports these environment variables:

- `NODE_ENV`: Set to "production" for production deployment
- `PORT`: Port number (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses memory storage if not provided)
- `OPENAI_API_KEY`: Required for AI features

## Health Check

The application includes a health check endpoint at `/api/health` that Docker uses to monitor container health.

## Troubleshooting

1. **Container won't start:**
   ```bash
   docker-compose logs app
   ```

2. **Port already in use:**
   ```bash
   # Change the port mapping in docker-compose.yml
   ports:
     - "3000:5000"  # Maps host port 3000 to container port 5000
   ```

3. **Rebuild after code changes:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **View build logs:**
   ```bash
   docker-compose build
   ```

5. **Check container sizes:**
   ```bash
   docker images | grep azure-testcase
   ```

## Production Considerations

1. **Use environment files for secrets:**
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_key_here" > .env
   ```

2. **Enable SSL/HTTPS in production**
3. **Use a reverse proxy (nginx) for production deployments**
4. **Set up proper logging and monitoring**
5. **Configure database backups if using PostgreSQL**