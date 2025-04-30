# ExpenseAI - Smart Expense Tracker

ExpenseAI is an intelligent expense tracking application that helps you manage your personal or business expenses with AI-powered categorization. This application allows you to record, categorize, and analyze your expenses with a user-friendly interface and insightful visualizations.

<img width="106" alt="image" src="https://github.com/user-attachments/assets/2664ac9f-1e15-47ee-88f3-f2f107476dca" />

For a demo of the app visit: [expenseai.onrender.com](https://expenseai.onrender.com)

<img width="1014" alt="image" src="https://github.com/user-attachments/assets/e4cb922d-cf42-4c41-a1fa-0fbfda36f630" />

<img width="686" alt="image" src="https://github.com/user-attachments/assets/31d0d009-46f9-459e-bd7d-fe6f69e0ec9b" />

<img width="997" alt="image" src="https://github.com/user-attachments/assets/07a0734b-dee5-42ac-8cec-95238e33bc73" />

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [AI Categorization](#ai-categorization)
- [Database Schema](#database-schema)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Expense Management:** Add, edit, delete, and view expenses
- **AI-Powered Categorization:** Automatically categorize expenses using Hugging Face models
- **Monthly Reports:** View expense summaries and breakdowns by month
- **Data Visualization:** Interactive charts to visualize spending patterns
- **Category Management:** Track spending by custom categories
- **Responsive Design:** Works on desktop and mobile devices

## Technologies Used

- **Frontend:**
  - HTML5, CSS3, JavaScript
  - Bootstrap 5 for responsive design
  - Chart.js for data visualization

- **Backend:**
  - Node.js and Express.js
  - PostgreSQL database
  - node-pg for database interactions
  - Hugging Face API for AI-powered categorization

- **Development Tools:**
  - Nodemon for automatic server restarts
  - dotenv for environment variable management
  - cors for Cross-Origin Resource Sharing

## Project Structure

```
ExpenseAI/
├── nodemon.json           # Nodemon configuration
├── package.json           # Node.js dependencies and scripts
├── server.js              # Main application entry point
├── .env                   # Environment variables (not in repository. Use sample.env file for example.)
├── public/                # Static assets
│   ├── index.html         # Main HTML file
│   ├── css/               # CSS stylesheets
│   │   └── style.css      # Main stylesheet
│   └── js/                # Frontend JavaScript
│       ├── api.js         # API client for backend communication
│       ├── app.js         # Main application initialization
│       ├── expenses.js    # Expenses page module
│       ├── monthly.js     # Monthly view module
│       └── utils.js       # Utility functions
└── src/                   # Server-side code
    ├── config/            # Configuration files
    │   ├── db.js          # Database connection setup
    │   └── db-init.js     # Database initialization
    ├── controllers/       # Request handlers
    │   └── expenseController.js # Expense-related logic
    ├── models/            # Data models
    │   ├── category.js    # Category model
    │   └── expense.js     # Expense model
    └── routes/            # API routes
        └── expenses.js    # Expense-related routes
```

## Installation

Follow these steps to set up ExpenseAI on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ExpenseAI.git
   cd ExpenseAI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a PostgreSQL database:**
   - Create a database for the application
   - Create tables in database for the application
   - Note the database connection details for configuration

4. **Set up environment variables:**
   - Copy the sample environment file to create your own `.env` file:
     ```bash
     cp sample.env .env
     ```
   - Edit the `.env` file and update the values with your actual configuration:
     ```
     # Server Configuration
     PORT=80

     # Update with your PostgreSQL database credentials
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=expense_tracker
     DB_USER=your_user
     DB_PASSWORD=your_password

     # Get a Hugging Face API key from https://huggingface.co/settings/tokens
     HUGGINGFACE_API_KEY=your_huggingface_api_key
     ```

5. **Start the application:**
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

6. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

## Configuration

### Database Configuration

The application uses PostgreSQL as its database. The connection is configured in `src/config/db.js` and uses the following environment variables:

- `DB_HOST`: PostgreSQL server hostname
- `DB_PORT`: PostgreSQL server port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

### AI Service Configuration

The AI-powered categorization uses Hugging Face models and is configured with these environment variables:

- `AI_API_URL`: URL of the Hugging Face model API
- `HUGGINGFACE_API_KEY`: Your Hugging Face API key

## Usage

### Expense Management

- **View Expenses:** The main page displays all your expenses in a table format
- **Add Expense:** Click the "Add Expense" button to record a new expense
- **Edit Expense:** Click the edit icon next to an expense to modify it
- **Delete Expense:** Click the delete icon to remove an expense
- **Filter Expenses:** Use the month filter to view expenses for a specific month

### Monthly Analysis

- Click on "Monthly View" in the navigation bar to access the monthly analysis
- View expense totals, category breakdowns, and visualizations
- Use the month selector to change the month being analyzed

### AI Categorization

- Select one or more expenses using the checkboxes
- Click the "Auto-Categorize" button to have the AI suggest categories
- The system will analyze the expense descriptions and assign appropriate categories

## API Endpoints

The application provides the following API endpoints:

### Expenses

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get a specific expense
- `POST /api/expenses` - Create a new expense
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

### Monthly Data

- `GET /api/expenses/month/:year/:month` - Get expenses for a specific month
- `GET /api/expenses/summary/:year/:month` - Get a summary of expenses for a month

### Categorization

- `POST /api/expenses/categorize` - Auto-categorize selected expenses

## AI Categorization

ExpenseAI uses Hugging Face's Natural Language Processing models to automatically categorize expenses based on their descriptions. The system uses:

- **Zero-shot Classification:** Determines the most appropriate category without prior training
- **Fallback Mechanism:** If AI categorization fails, the system uses keyword-based categorization

Models used:
- `facebook/bart-large-mnli` - A robust zero-shot classification model
- Alternative models can be configured by changing the `AI_API_URL` environment variable

## Database Schema

### Expenses Table

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table

```sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  frequency INTEGER DEFAULT 1
);
```

### Insert Default Categories

```sql
INSERT INTO categories (name) 
VALUES 
  ('Food'), ('Transportation'), ('Housing'), ('Entertainment'), 
  ('Healthcare'), ('Utilities'), ('Shopping'), ('Education')
ON CONFLICT (name) DO NOTHING
);
```

## Future Enhancements

- **Budget Management:** Set and track budgets for different categories
- **Export Functionality:** Export expense data to CSV or PDF
- **Multi-currency Support:** Handle expenses in different currencies
- **Receipt Scanning:** OCR integration to automatically extract expense data from receipts
- **User Authentication:** Multi-user support with different access levels
- **Advanced Analytics:** More detailed insights and predictions based on spending patterns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License - see the LICENSE file for details.

---

Created with ❤️ by S.Buchanan - [GitHub Profile](https://github.com/Buchatech)