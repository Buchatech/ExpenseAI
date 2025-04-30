const Expense = require('../models/expense');
const Category = require('../models/category');
const fetch = require('node-fetch');
const moment = require('moment');

// Environment configuration
require('dotenv').config();
const AI_API_URL = process.env.AI_API_URL;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Controller for expense operations
const expenseController = {
  // Get all expenses
  async getAllExpenses(req, res) {
    try {
      const expenses = await Expense.getAll();
      res.json(expenses);
    } catch (error) {
      console.error('Error getting expenses:', error);
      res.status(500).json({ error: 'Failed to get expenses' });
    }
  },

  // Get expenses by month
  async getExpensesByMonth(req, res) {
    const { year, month } = req.params;
    try {
      const expenses = await Expense.getByMonth(year, month);
      const summary = await Expense.getMonthlySummary(year, month);
      
      // Calculate total for the month
      const totalAmount = summary.reduce((acc, item) => acc + parseFloat(item.total_amount), 0);
      
      res.json({
        expenses,
        summary,
        totalAmount
      });
    } catch (error) {
      console.error('Error getting expenses by month:', error);
      res.status(500).json({ error: 'Failed to get expenses for the specified month' });
    }
  },

  // Get a single expense
  async getExpense(req, res) {
    const { id } = req.params;
    try {
      const expense = await Expense.getById(id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error) {
      console.error('Error getting expense:', error);
      res.status(500).json({ error: 'Failed to get expense' });
    }
  },

  // Create a new expense
  async createExpense(req, res) {
    const { description, amount, category, expenseDate } = req.body;
    
    if (!description || !amount || !expenseDate) {
      return res.status(400).json({ error: 'Description, amount, and date are required' });
    }
    
    try {
      // Use current date if expenseDate is not provided
      const formattedDate = expenseDate || moment().format('YYYY-MM-DD');
      const newExpense = await Expense.create(description, amount, category, formattedDate);
      
      // If category is provided, increment its usage count
      if (category) {
        await Category.incrementUsage(category);
      }
      
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  },

  // Update an expense
  async updateExpense(req, res) {
    const { id } = req.params;
    const { description, amount, category, expenseDate } = req.body;
    
    try {
      const existingExpense = await Expense.getById(id);
      if (!existingExpense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      const updatedExpense = await Expense.update(
        id,
        description || existingExpense.description,
        amount || existingExpense.amount,
        category || existingExpense.category,
        expenseDate || existingExpense.expense_date
      );
      
      // If category is updated, increment its usage count
      if (category && category !== existingExpense.category) {
        await Category.incrementUsage(category);
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  },

  // Delete an expense
  async deleteExpense(req, res) {
    const { id } = req.params;
    
    try {
      const deletedExpense = await Expense.delete(id);
      if (!deletedExpense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json({ message: 'Expense deleted successfully', expense: deletedExpense });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  },

  // Get expense summary for a month
  async getMonthlySummary(req, res) {
    const { year, month } = req.params;
    
    try {
      const summary = await Expense.getMonthlySummary(year, month);
      const totalAmount = summary.reduce((acc, item) => acc + parseFloat(item.total_amount), 0);
      
      res.json({
        summary,
        totalAmount,
        month,
        year
      });
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      res.status(500).json({ error: 'Failed to get monthly summary' });
    }
  },

  // Auto-categorize expenses using AI
  async categorizeBatch(req, res) {
    const { expenseIds } = req.body;
    
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ error: 'Please provide valid expense IDs' });
    }
    
    try {
      const results = [];
      const existingCategories = await Category.getAll();
      const categoryNames = existingCategories.map(cat => cat.name);
      
      // Process each expense for categorization
      for (const id of expenseIds) {
        const expense = await Expense.getById(id);
        if (!expense) {
          results.push({ id, status: 'error', message: 'Expense not found' });
          continue;
        }
        
        try {
          // Call the AI service to predict category
          const categoryPrediction = await predictCategory(expense.description, categoryNames);
          
          if (categoryPrediction) {
            // Update the expense with the predicted category
            const updatedExpense = await Expense.update(
              id,
              expense.description,
              expense.amount,
              categoryPrediction,
              expense.expense_date
            );
            
            // Increment the usage count for the predicted category
            await Category.incrementUsage(categoryPrediction);
            
            results.push({
              id,
              status: 'success',
              previousCategory: expense.category || 'None',
              newCategory: categoryPrediction
            });
          } else {
            results.push({ id, status: 'error', message: 'Could not predict category' });
          }
        } catch (aiError) {
          console.error(`AI categorization error for expense ${id}:`, aiError);
          results.push({ id, status: 'error', message: 'AI service error' });
        }
      }
      
      res.json({ results });
    } catch (error) {
      console.error('Error in bulk categorization:', error);
      res.status(500).json({ error: 'Failed to categorize expenses' });
    }
  }
};

// Function to predict category using Hugging Face API
async function predictCategory(description, existingCategories) {
  if (!HUGGINGFACE_API_KEY) {
    console.log('No Hugging Face API key found, using simple categorization');
    // Use a simple keyword-based fallback if API key is not set
    return simpleKeywordCategorization(description, existingCategories);
  }
  
  try {
    console.log(`Attempting to categorize description: "${description}" with Hugging Face API`);
    console.log(`Using API URL: ${AI_API_URL}`);
    
    // Different payload format based on model
    let payload;
    
    // Check if using bart-large-mnli (zero-shot classification)
    if (AI_API_URL.includes('bart-large-mnli') || AI_API_URL.includes('distilbert-base-uncased-mnli')) {
      // Format for zero-shot classification models
      payload = {
        inputs: description,
        parameters: {
          candidate_labels: existingCategories.join(',')
        }
      };
    } else {
      // Default format for text generation models
      payload = {
        inputs: `Categorize this expense: "${description}". Categories: ${existingCategories.join(', ')}`,
        parameters: {
          max_length: 100,
          return_full_text: false
        }
      };
    }
    
    console.log('Sending payload to Hugging Face:', JSON.stringify(payload));
    
    // Make API request
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error response:', errorText);
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Hugging Face API response:', JSON.stringify(data));
    
    // Process response based on model type
    let predictedCategory = null;
    
    // Check if using zero-shot classification models
    if (AI_API_URL.includes('bart-large-mnli') || AI_API_URL.includes('distilbert-base-uncased-mnli')) {
      // For zero-shot models, response format is different
      if (data && data.labels && data.scores && data.labels.length > 0) {
        // Get the highest scoring category
        const highestIndex = data.scores.indexOf(Math.max(...data.scores));
        predictedCategory = data.labels[highestIndex];
      }
    } else {
      // For text generation models
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        // Extract the category name from the generated text
        const generatedText = data[0].generated_text.toLowerCase();
        
        // Find which category name is mentioned in the response
        predictedCategory = existingCategories.find(category => 
          generatedText.includes(category.toLowerCase())
        );
      }
    }
    
    if (predictedCategory) {
      console.log(`Predicted category: ${predictedCategory}`);
      return predictedCategory;
    } else {
      console.log('No category predicted by API, falling back to keyword-based categorization');
      return simpleKeywordCategorization(description, existingCategories);
    }
  } catch (error) {
    console.error('Error predicting category from Hugging Face API:', error);
    // Fallback to simple categorization on API error
    return simpleKeywordCategorization(description, existingCategories);
  }
}

// Simple keyword-based categorization as a fallback
function simpleKeywordCategorization(description, categories) {
  const text = description.toLowerCase();
  
  const keywordMap = {
    'food': ['grocery', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'coffee', 'pizza', 'burger'],
    'transportation': ['gas', 'fuel', 'bus', 'train', 'taxi', 'uber', 'lyft', 'subway', 'car', 'vehicle', 'toll', 'parking'],
    'housing': ['rent', 'mortgage', 'apartment', 'home', 'house', 'property'],
    'utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'bill', 'utility'],
    'entertainment': ['movie', 'game', 'concert', 'show', 'theater', 'netflix', 'spotify', 'subscription'],
    'healthcare': ['doctor', 'medical', 'health', 'medicine', 'dental', 'pharmacy', 'hospital', 'clinic'],
    'shopping': ['clothes', 'shoes', 'clothing', 'amazon', 'walmart', 'target', 'buy', 'purchase'],
    'education': ['tuition', 'book', 'school', 'college', 'university', 'course', 'class']
  };
  
  // Check each category for keyword matches
  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (categories.includes(category) && keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  // If no match, return the default category or the first category
  return categories.includes('Miscellaneous') ? 'Miscellaneous' : (categories[0] || 'Other');
}

module.exports = expenseController;