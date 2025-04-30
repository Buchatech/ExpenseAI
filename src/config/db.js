const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Log environment status to help with debugging
console.log('Environment variables check:');
console.log(`- Database host configured as: ${process.env.DB_HOST || 'Not set'}`);
console.log(`- Database URL available: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
console.log(`- Running in environment: ${process.env.NODE_ENV || 'development'}`);

// Create PostgreSQL connection pool with enhanced connection settings
const pool = (() => {
  // Use DATABASE_URL if available (Render sets this automatically for internal databases)
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL connection string');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });
  } 
  // Use individual params if host is explicitly set to anything other than localhost
  else if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    console.log(`Using explicit database connection to: ${process.env.DB_HOST}`);
    return new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });
  }
  // If nothing is configured, convert explicit Render PostgreSQL database connection info 
  // to a connection string (if all values are available)
  else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    // Construct a connection string from individual parts
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
    console.log('Constructed connection string from individual parameters');
    return new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });
  }
  // Last fallback option - will likely fail on Render but at least provides clear error message
  else {
    console.warn('WARNING: No valid database connection configuration found!');
    console.warn('Falling back to localhost, which will likely fail in production.');
    console.warn('Please set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    return new Pool({
      host: 'localhost',
      port: 5432,
      database: 'expense_tracker',
      user: 'postgres',
      password: 'password'
    });
  }
})();

// Improve error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'ECONNREFUSED') {
    console.error('Connection refused. Check that your database is running and accessible.');
    console.error(`Attempted connection to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  }
});

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused - database server may be down or network configuration is preventing connection');
    }
    if (err.code === 'ENOTFOUND') {
      console.error('Host not found - check your DB_HOST value');
    }
  } else {
    console.log('Successfully connected to PostgreSQL database');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};