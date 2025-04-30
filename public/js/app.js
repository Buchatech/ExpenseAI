/**
 * Main application entry point for ExpenseAI
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation
  setupNavigation();
  
  // Load expenses page by default
  ExpensesModule.init();
});

// Set up navigation between different sections
function setupNavigation() {
  // Expenses navigation link
  const expensesLink = document.getElementById('nav-expenses');
  expensesLink.addEventListener('click', (e) => {
    e.preventDefault();
    ExpensesModule.init();
    
    // Update active state
    setActiveNavItem('nav-expenses');
  });
  
  // Monthly view navigation link
  const monthlyLink = document.getElementById('nav-monthly');
  monthlyLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Check if MonthlyModule exists
    if (typeof MonthlyModule !== 'undefined' && MonthlyModule.init) {
      MonthlyModule.init();
    } else {
      // Fallback if MonthlyModule is not implemented yet
      showToast('Notice', 'Monthly view is not implemented yet', 'info');
    }
    
    // Update active state
    setActiveNavItem('nav-monthly');
  });
  
  // Set expenses link as active by default
  setActiveNavItem('nav-expenses');
}

// Set active navigation item
function setActiveNavItem(id) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to the selected item
  const activeLink = document.getElementById(id);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}