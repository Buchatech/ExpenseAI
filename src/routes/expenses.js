const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Get all expenses
router.get('/', expenseController.getAllExpenses);

// Get monthly expenses and summary
router.get('/month/:year/:month', expenseController.getExpensesByMonth);

// Get monthly summary only
router.get('/summary/:year/:month', expenseController.getMonthlySummary);

// Get a specific expense
router.get('/:id', expenseController.getExpense);

// Create a new expense
router.post('/', expenseController.createExpense);

// Update an expense
router.put('/:id', expenseController.updateExpense);

// Delete an expense
router.delete('/:id', expenseController.deleteExpense);

// Batch categorize expenses using AI
router.post('/categorize', expenseController.categorizeBatch);

module.exports = router;