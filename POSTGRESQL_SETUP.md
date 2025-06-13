# PostgreSQL Setup Guide

This guide covers setting up PostgreSQL persistence for the Azure DevOps Test Case Management application.

## Quick Setup with Replit Database

The easiest way to add PostgreSQL persistence:

1. **Enable PostgreSQL in your Replit project**
   - The DATABASE_URL environment variable is automatically configured
   - Tables are created automatically on first run

2. **Push database schema**
   ```bash
   npm run db:push
   ```

3. **Restart the application**
   - The application will automatically detect and use PostgreSQL
   - You'll see "✅ Database connection established" in the logs

## Manual PostgreSQL Setup

### Local Development

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   
   # Windows - Download from postgresql.org
   ```

2. **Create Database**
   ```bash
   sudo -u postgres createdb testcase_management
   sudo -u postgres createuser testuser
   sudo -u postgres psql -c "ALTER USER testuser WITH PASSWORD 'your_secure_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE testcase_management TO testuser;"
   ```

3. **Configure Environment**
   ```bash
   # Add to .env file
   DATABASE_URL=postgresql://testuser:your_secure_password@localhost:5432/testcase_management
   ```

4. **Initialize Schema**
   ```bash
   npm run db:push
   ```

### Docker Setup

1. **Using Docker Compose (Recommended)**
   ```bash
   # Default setup includes PostgreSQL
   docker-compose up -d
   
   # Database will be available at:
   # Host: localhost
   # Port: 5432
   # Database: testcase_db
   # Username: postgres
   # Password: secure_password_123
   ```

2. **Custom Database Configuration**
   
   Edit `docker-compose.yml`:
   ```yaml
   postgres:
     image: postgres:15-alpine
     environment:
       POSTGRES_DB: your_database_name
       POSTGRES_USER: your_username
       POSTGRES_PASSWORD: your_secure_password
     ports:
       - "5432:5432"
   
   app:
     environment:
       - DATABASE_URL=postgresql://your_username:your_secure_password@postgres:5432/your_database_name
   ```

## Database Schema

The application uses the following main tables:

- **azure_configs** - Azure DevOps connection settings
- **user_stories** - Imported user stories from Azure DevOps
- **test_cases** - Generated and imported test cases
- **test_plans** - Test plan organization
- **test_suites** - Test suite groupings
- **test_case_links** - Links between test cases and user stories
- **test_case_feedback** - User feedback on test cases
- **ai_context** - AI learning and context data
- **test_data_configs** - Test data management
- **environment_configs** - Testing environment settings
- **ai_configurations** - AI generation preferences

## Data Migration

### From Memory Storage to PostgreSQL

1. **Export existing data** (if any important data exists in memory)
   ```bash
   # Use the application's export functionality
   # Go to test cases section and export to Excel/CSV
   ```

2. **Enable PostgreSQL**
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL=postgresql://user:pass@host:5432/db
   
   # Push schema
   npm run db:push
   
   # Restart application
   npm run dev
   ```

3. **Re-import data**
   - Use the CSV import feature to restore test cases
   - Reconfigure Azure DevOps connection
   - Re-import user stories from Azure DevOps

### From PostgreSQL to Memory Storage

1. **Export current data**
   ```bash
   # Export test cases and configurations through the UI
   ```

2. **Remove DATABASE_URL**
   ```bash
   unset DATABASE_URL
   # or remove from .env file
   ```

3. **Restart application**
   ```bash
   npm run dev
   ```

## Database Maintenance

### Backup Database

```bash
# Using pg_dump
pg_dump -h localhost -U postgres -d testcase_db > backup.sql

# Using Docker
docker-compose exec postgres pg_dump -U postgres testcase_db > backup.sql
```

### Restore Database

```bash
# Using psql
psql -h localhost -U postgres -d testcase_db < backup.sql

# Using Docker
docker-compose exec -T postgres psql -U postgres testcase_db < backup.sql
```

### Reset Database

```bash
# Drop and recreate all tables
npm run db:push

# Or manually reset
docker-compose down -v  # Removes volumes
docker-compose up -d
```

## Environment Variables

Required PostgreSQL environment variables:

- `DATABASE_URL` - Full PostgreSQL connection string
- `PGHOST` - Database host (auto-set by Replit)
- `PGPORT` - Database port (auto-set by Replit)
- `PGUSER` - Database username (auto-set by Replit)
- `PGPASSWORD` - Database password (auto-set by Replit)
- `PGDATABASE` - Database name (auto-set by Replit)

## Troubleshooting

### Connection Issues

1. **Check database is running**
   ```bash
   # Local PostgreSQL
   sudo systemctl status postgresql
   
   # Docker
   docker-compose ps postgres
   ```

2. **Verify connection string**
   ```bash
   # Test connection
   psql "postgresql://user:pass@host:5432/database"
   ```

3. **Check firewall/network**
   ```bash
   # Test port connectivity
   telnet localhost 5432
   ```

### Schema Issues

1. **Reset schema**
   ```bash
   npm run db:push
   ```

2. **Check table creation**
   ```sql
   \dt  -- List tables in psql
   ```

### Performance Optimization

1. **Add indexes** (automatically handled by Drizzle)
2. **Monitor query performance**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM test_cases;
   ```

3. **Regular maintenance**
   ```sql
   VACUUM ANALYZE;
   ```

## Security Considerations

- Use strong passwords for database users
- Limit database user permissions to necessary tables only
- Enable SSL/TLS for production connections
- Regular security updates for PostgreSQL
- Backup encryption for sensitive test data
- Network security (firewall rules, VPN access)

## Production Deployment

For production PostgreSQL deployment:

1. **Use managed database services** (AWS RDS, Google Cloud SQL, Azure Database)
2. **Enable connection pooling**
3. **Set up automated backups**
4. **Monitor database performance**
5. **Configure SSL connections**
6. **Set up database replication** (if high availability needed)

---

**Note**: The application gracefully falls back to memory storage if PostgreSQL is unavailable, ensuring continuous operation during database maintenance.