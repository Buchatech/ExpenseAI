const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create PostgreSQL connection pool with enhanced connection settings
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Adding SSL configuration for secure connection to remote database
  ssl: {
    rejectUnauthorized: false // This allows connecting to servers with self-signed certificates
  },
  // Connection retry settings
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 10, // Maximum number of clients in the pool
});

// Improve error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};