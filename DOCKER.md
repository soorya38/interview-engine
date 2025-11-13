# Docker Setup Guide

This guide explains how to run the FreelanceFlow Interview Platform using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 4GB of available RAM (8GB+ recommended for Ollama)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd FreelanceFlow-1\ 2
   ```

2. **Create environment file**:
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` file** (optional, defaults work for development):
   - Change `SESSION_SECRET` to a strong random string for production
   - Adjust database credentials if needed
   - Modify Ollama model if desired

4. **Start all services**:
   ```bash
   docker-compose up -d
   ```

5. **Initialize the database** (first time only):
   ```bash
   # Run migrations and seed data
   docker-compose exec app npm run db:push
   docker-compose exec app npm run seed
   ```

6. **Access the application**:
   - Application: http://localhost:5173
   - PostgreSQL: localhost:5432
   - Ollama API: http://localhost:11434

## Services

### Application (`app`)
- Main FreelanceFlow application
- Port: 5173 (configurable via `PORT` env var)
- Depends on: PostgreSQL, Ollama

### PostgreSQL (`postgres`)
- Database server
- Port: 5432 (configurable via `POSTGRES_PORT` env var)
- Data persisted in `postgres_data` volume
- Default credentials: `postgres/postgres`

### Ollama (`ollama`)
- LLM service for AI interview evaluation
- Port: 11434 (configurable via `OLLAMA_PORT` env var)
- Models stored in `ollama_data` volume
- Default model: `llama3.2:latest`

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f ollama
```

### Rebuild application
```bash
docker-compose build app
docker-compose up -d app
```

### Access database
```bash
# Using psql
docker-compose exec postgres psql -U postgres -d mockmate_dev

# Or connect from host
psql -h localhost -p 5432 -U postgres -d mockmate_dev
```

### Run database migrations
```bash
docker-compose exec app npm run db:push
```

### Seed database
```bash
docker-compose exec app npm run seed
```

### Pull Ollama model
```bash
docker-compose exec ollama ollama pull llama3.2:latest
# Or any other model
docker-compose exec ollama ollama pull mistral:latest
```

### View service status
```bash
docker-compose ps
```

### Stop and remove everything (including volumes)
```bash
docker-compose down -v
```

## Environment Variables

See `.env.example` for all available environment variables.

### Important Production Settings

1. **SESSION_SECRET**: Must be a strong random string (32+ characters)
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

2. **POSTGRES_PASSWORD**: Use a strong password in production

3. **Database URL**: Can be set directly or auto-generated from individual vars

## Development vs Production

### Development
- Uses default credentials
- Ollama model pulled on first use
- Hot reload not available (rebuild required)

### Production
- Change all default passwords
- Use strong SESSION_SECRET
- Pre-pull Ollama models
- Set up proper backups for PostgreSQL
- Use reverse proxy (nginx/traefik) for HTTPS
- Configure proper firewall rules

## Troubleshooting

### Application won't start
1. Check logs: `docker-compose logs app`
2. Verify database is healthy: `docker-compose ps`
3. Ensure ports aren't already in use

### Database connection errors
1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check database credentials in `.env`
3. Ensure database is initialized: `docker-compose exec app npm run db:push`

### Ollama model not found
1. Pull the model: `docker-compose exec ollama ollama pull llama3.2:latest`
2. Check available models: `docker-compose exec ollama ollama list`
3. Verify OLLAMA_MODEL in `.env` matches pulled model

### Port conflicts
- Change ports in `.env` file
- Or stop conflicting services

### Out of memory
- Ollama requires significant RAM for models
- Reduce model size or increase Docker memory limit
- Consider using a smaller model

## Data Persistence

- **PostgreSQL data**: Stored in `postgres_data` Docker volume
- **Ollama models**: Stored in `ollama_data` Docker volume
- **Application**: Stateless, no persistent data

To backup:
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres mockmate_dev > backup.sql

# Backup volumes
docker run --rm -v freelanceflow-1-2_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Building for Production

```bash
# Build the image
docker build -t freelanceflow:latest .

# Or use docker-compose
docker-compose build
```

## Health Checks

All services include health checks:
- **PostgreSQL**: Checks if database is ready
- **Ollama**: Checks if API is responding
- **App**: Checks if API endpoint responds

View health status:
```bash
docker-compose ps
```

## Network

All services are on the `freelanceflow-network` bridge network and can communicate using service names:
- `postgres` (database)
- `ollama` (LLM service)
- `app` (application)

## Security Notes

1. **Never commit `.env` file** - it contains secrets
2. **Change default passwords** in production
3. **Use strong SESSION_SECRET** in production
4. **Limit exposed ports** - only expose what's necessary
5. **Use reverse proxy** for HTTPS in production
6. **Regular backups** of PostgreSQL data

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all services are healthy: `docker-compose ps`

