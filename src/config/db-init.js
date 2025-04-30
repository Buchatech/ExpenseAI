const db = require('./db');

// SQL script to create tables if they don't exist
const createTablesQuery = `
-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table for AI suggestions
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  frequency INTEGER DEFAULT 1
);

-- Insert some default categories
INSERT INTO categories (name) 
VALUES 
  ('Food'), ('Transportation'), ('Housing'), ('Entertainment'), 
  ('Healthcare'), ('Utilities'), ('Shopping'), ('Education')
ON CONFLICT (name) DO NOTHING;
`;

// Helper function to wait for a specified time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize the database tables with retry logic
const initDatabase = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt} of ${retries}...`);
      
      // Verify connection first before attempting to create tables
      const pingResult = await db.query('SELECT 1 as ping');
      console.log('Database connection established successfully.');
      
      console.log('Initializing database tables...');
      await db.query(createTablesQuery);
      
      // Verify connection by running a simple query
      const testConnection = await db.query('SELECT NOW() as now');
      console.log('Database connection successful. Server time:', testConnection.rows[0].now);
      
      // Check if tables were created
      const tablesCheck = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('Available tables:', tablesCheck.rows.map(row => row.table_name).join(', '));
      console.log('Database tables initialized successfully');
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${attempt} failed:`, err.message);
      
      if (attempt === retries) {
        console.error('Maximum connection attempts reached. Database connection details:', {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          // Not logging password for security reasons
        });
        
        console.error('Connection error details:', {
          code: err.code,
          errno: err.errno,
          syscall: err.syscall
        });
        
        console.error('Please check your network connection and database credentials.');
        throw err;
      }
      
      console.log(`Retrying in ${delay/1000} seconds...`);
      await sleep(delay);
    }
  }
};

module.exports = { initDatabase };