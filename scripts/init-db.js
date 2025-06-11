#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Check if DATABASE_URL is set and valid
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'test') {
      console.error('❌ DATABASE_URL not properly configured');
      console.log('Please set a valid PostgreSQL connection string in your DATABASE_URL secret');
      console.log('Example: postgresql://username:password@hostname:5432/database_name');
      process.exit(1);
    }

    console.log('✅ DATABASE_URL found');
    
    // Push schema to database
    console.log('📋 Creating database tables...');
    execSync('npm run db:push', { stdio: 'inherit', cwd: join(__dirname, '..') });
    
    console.log('✅ Database initialization completed successfully!');
    console.log('🎉 Your AI Test Case Generator is ready to use');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Ensure your database server is accessible');
    console.log('3. Check that the database exists');
    process.exit(1);
  }
}

initDatabase();