# Docker Deployment Guide

This guide explains how to deploy the Test Case Management System using Docker.

## Quick Start

### Option 1: Docker Compose (Recommended)
Run the complete application with PostgreSQL database:

```bash
docker-compose up -d
```

The application will be available at http://localhost:5000

### Option 2: Docker Build Only
Build and run just the application container:

```bash
# Build the image
docker build -t test-case-manager .

# Run the container
docker run -p 5000:5000 test-case-manager
```

## Configuration

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV` - Set to `production` for production deployment
- `DATABASE_URL` - PostgreSQL connection string (optional, uses memory storage if not provided)
- `PORT` - Port to run the application on (default: 5000)

### Database Setup

If using PostgreSQL, the application will automatically create the necessary tables on startup.

## Docker Compose Services

- **app**: The main application container
- **db**: PostgreSQL database container

## Health Check

The application includes a health check endpoint at `/api/health` that Docker uses to monitor container health.

## Security Features

- Multi-stage build for smaller production image
- Non-root user execution
- Minimal attack surface using Alpine Linux
- Production dependencies only in final image

## Volumes

- `postgres_data`: Persistent storage for PostgreSQL data
- `uploads`: Storage for uploaded files

## Ports

- `5000`: Application server
- `5432`: PostgreSQL database (only exposed for development)

## Stopping the Application

```bash
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```