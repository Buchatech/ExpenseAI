/**
 * API service functions for the ExpenseAI app
 */

// Base API URL
const API_BASE_URL = '/api';

// API endpoints for expenses
const API = {
  // Get all expenses
  async getAllExpenses() {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get expenses for a specific month
  async getExpensesByMonth(year, month) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/month/${year}/${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses for the month');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching expenses by month:', error);
      throw error;
    }
  },

  // Get monthly summary
  async getMonthlySummary(year, month) {
    try {
      console.log(`Fetching monthly summary for ${year}-${month} from ${API_BASE_URL}/expenses/summary/${year}/${month}`);
      const response = await fetch(`${API_BASE_URL}/expenses/summary/${year}/${month}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error status: ${response.status}, Response:`, errorText);
        throw new Error(`Failed to fetch monthly summary: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Monthly summary API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  },

  // Get a single expense by ID
  async getExpense(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching expense ${id}:`, error);
      throw error;
    }
  },

  // Create a new expense
  async createExpense(expenseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON
          errorMessage = JSON.parse(errorText).error || 'Failed to create expense';
        } catch (e) {
          // If not JSON, use the text directly
          errorMessage = errorText || `HTTP error ${response.status}`;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error creating expense:', error);
      throw error;
    }
  },

  // Update an existing expense
  async updateExpense(id, expenseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating expense ${id}:`, error);
      throw error;
    }
  },

  // Delete an expense
  async deleteExpense(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting expense ${id}:`, error);
      throw error;
    }
  },

  // Auto-categorize expenses using AI
  async categorizeExpenses(expenseIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenseIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to categorize expenses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error categorizing expenses:', error);
      throw error;
    }
  }
};