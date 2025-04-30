/**
 * Utility functions for the ExpenseAI app
 */

// Format currency amount
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date to display format (e.g., "Apr 15, 2025")
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format date to ISO format for inputs (YYYY-MM-DD)
function formatDateForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Show toast notification
function showToast(title, message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  
  // Set content and style
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // Set toast color based on type
  toast.classList.remove('bg-success', 'bg-danger', 'bg-info');
  toast.classList.add(`bg-${type}`);
  toast.classList.add('text-white');
  
  // Create Bootstrap toast instance and show it
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Generate random colors for charts
function generateRandomColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137) % 360; // Use golden angle to get visually distinct colors
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
}

// Get current year and month
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // months are 0-indexed in JS
  return { year, month };
}

// Format year and month for display (e.g., "April 2025")
function formatYearMonth(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
}

// Format for HTML month input (YYYY-MM)
function formatYearMonthForInput(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Parse HTML month input value (YYYY-MM) into { year, month }
function parseYearMonthInput(value) {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

// Calculate percentage
function calculatePercentage(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
}

// Sort expenses by date (newest first)
function sortExpensesByDate(expenses) {
  return [...expenses].sort((a, b) => 
    new Date(b.expense_date) - new Date(a.expense_date)
  );
}

// Format year and month for display (e.g., "April 2025")
function formatMonthYear(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
}