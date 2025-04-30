const db = require('../config/db');

class Expense {
  // Create a new expense
  static async create(description, amount, category, expenseDate) {
    const query = `
      INSERT INTO expenses (description, amount, category, expense_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    try {
      const result = await db.query(query, [description, amount, category, expenseDate]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all expenses
  static async getAll() {
    const query = `
      SELECT * FROM expenses
      ORDER BY expense_date DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get expenses for a specific month
  static async getByMonth(year, month) {
    const query = `
      SELECT * FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = $1
      AND EXTRACT(MONTH FROM expense_date) = $2
      ORDER BY expense_date DESC
    `;
    try {
      const result = await db.query(query, [year, month]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get a single expense by ID
  static async getById(id) {
    const query = `
      SELECT * FROM expenses
      WHERE id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update an expense
  static async update(id, description, amount, category, expenseDate) {
    const query = `
      UPDATE expenses
      SET description = $1, amount = $2, category = $3, expense_date = $4
      WHERE id = $5
      RETURNING *
    `;
    try {
      const result = await db.query(query, [description, amount, category, expenseDate, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete an expense
  static async delete(id) {
    const query = `
      DELETE FROM expenses
      WHERE id = $1
      RETURNING *
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get monthly totals by category
  static async getMonthlySummary(year, month) {
    const query = `
      SELECT 
        category, 
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = $1
      AND EXTRACT(MONTH FROM expense_date) = $2
      GROUP BY category
      ORDER BY total_amount DESC
    `;
    try {
      const result = await db.query(query, [year, month]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Expense;