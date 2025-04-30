const db = require('../config/db');

class Category {
  // Get all categories
  static async getAll() {
    const query = `
      SELECT * FROM categories
      ORDER BY frequency DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update category frequency when used
  static async incrementUsage(categoryName) {
    const query = `
      INSERT INTO categories (name, frequency) 
      VALUES ($1, 1)
      ON CONFLICT (name) 
      DO UPDATE SET frequency = categories.frequency + 1
      RETURNING *
    `;
    try {
      const result = await db.query(query, [categoryName]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get most frequently used categories
  static async getMostFrequent(limit = 10) {
    const query = `
      SELECT name, frequency 
      FROM categories
      ORDER BY frequency DESC
      LIMIT $1
    `;
    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;