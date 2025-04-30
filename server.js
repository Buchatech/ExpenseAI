const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Print environment information for debugging
console.log(`Starting server in ${process.env.NODE_ENV || 'development'} environment`);
console.log(`Server port: ${process.env.PORT || 3000}`);

// Database initialization
const { initDatabase } = require('./src/config/db-init');

// Import routes
const expenseRoutes = require('./src/routes/expenses');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/expenses', expenseRoutes);

// Health check endpoint (useful for Render health checks)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main HTML file for all routes except API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start the server even if database initialization fails
// This allows the server to start and retry database connections later
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

// Max number of database connection attempts
const MAX_DB_INIT_ATTEMPTS = 5;
let currentAttempt = 0;

// Function to attempt database initialization with retries
const attemptDatabaseInit = async () => {
  currentAttempt++;
  console.log(`Database initialization attempt ${currentAttempt} of ${MAX_DB_INIT_ATTEMPTS}`);
  
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    return true;
  } catch (err) {
    console.error(`Database initialization attempt ${currentAttempt} failed:`, err.message);
    
    if (currentAttempt < MAX_DB_INIT_ATTEMPTS) {
      const delay = 5000; // 5 seconds between retries
      console.log(`Retrying in ${delay/1000} seconds...`);
      setTimeout(attemptDatabaseInit, delay);
    } else {
      console.error('All database initialization attempts failed.');
      console.error('The application will continue running, but database operations will fail.');
      console.error('Please check your database configuration and connectivity.');
    }
    return false;
  }
};

// Start database initialization
attemptDatabaseInit();