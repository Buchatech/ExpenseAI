/**
 * Expenses management for ExpenseAI app
 */

// Module for managing the expenses list page
const ExpensesModule = (() => {
  // Private variables
  let expenses = [];
  let categories = [];
  let currentFilter = getCurrentYearMonth();
  
  // Cache DOM elements
  const mainContent = document.getElementById('main-content');
  
  // Initialize expenses page
  async function init() {
    // Clone template
    const template = document.getElementById('expenses-template');
    const content = template.content.cloneNode(true);
    
    // Clear main content and append template
    mainContent.innerHTML = '';
    mainContent.appendChild(content);
    
    // Add event listeners
    setupEventListeners();
    
    // Load initial data
    await loadExpenses();
    
    // Set initial month filter value
    const monthFilter = document.getElementById('month-filter');
    monthFilter.value = formatYearMonthForInput(currentFilter.year, currentFilter.month);
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Add expense button
    const addButton = document.getElementById('add-expense');
    addButton.addEventListener('click', showAddExpenseModal);
    
    // Auto-categorize button
    const categorizeButton = document.getElementById('categorize-expenses');
    categorizeButton.addEventListener('click', handleCategorize);
    
    // Month filter
    const monthFilter = document.getElementById('month-filter');
    monthFilter.addEventListener('change', handleMonthFilterChange);
    
    // Select all checkbox
    const selectAll = document.getElementById('select-all-expenses');
    selectAll.addEventListener('change', handleSelectAllChange);
    
    // Save expense button in modal
    const saveButton = document.getElementById('save-expense');
    saveButton.addEventListener('click', handleSaveExpense);
    
    // Delete confirmation button
    const deleteButton = document.getElementById('confirm-delete');
    deleteButton.addEventListener('click', handleConfirmDelete);
  }
  
  // Load expenses and update UI
  async function loadExpenses() {
    try {
      // Show loading state
      const tableBody = document.getElementById('expenses-table-body');
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading expenses...</td></tr>';
      
      // Fetch data from API
      const data = await API.getExpensesByMonth(currentFilter.year, currentFilter.month);
      expenses = data.expenses || [];
      
      // Fetch categories for dropdown
      await loadCategories();
      
      // Update UI
      renderExpenses();
      updateSummary(data.summary, data.totalAmount);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      showToast('Error', 'Failed to load expenses', 'danger');
    }
  }
  
  // Load categories for the dropdown
  async function loadCategories() {
    try {
      // This would be handled by a proper endpoint in a full implementation
      // For now, we'll extract unique categories from expenses
      const uniqueCategories = new Set();
      expenses.forEach(expense => {
        if (expense.category) {
          uniqueCategories.add(expense.category);
        }
      });
      
      // Add default categories if they don't exist
      ['Food', 'Transportation', 'Housing', 'Entertainment', 
       'Healthcare', 'Utilities', 'Shopping', 'Education', 'Miscellaneous'].forEach(category => {
        uniqueCategories.add(category);
      });
      
      categories = Array.from(uniqueCategories).sort();
      
      // Update category dropdown
      const categorySelect = document.getElementById('expense-category');
      const currentValue = categorySelect.value;
      
      // Clear options except the first one
      while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
      }
      
      // Add categories
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
      
      // Restore selected value if it exists
      if (currentValue) {
        categorySelect.value = currentValue;
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }
  
  // Render expenses in the table
  function renderExpenses() {
    const tableBody = document.getElementById('expenses-table-body');
    const noExpenses = document.getElementById('no-expenses');
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (expenses.length === 0) {
      noExpenses.style.display = 'block';
      return;
    }
    
    noExpenses.style.display = 'none';
    
    // Sort expenses by date (newest first)
    const sortedExpenses = sortExpensesByDate(expenses);
    
    // Create table rows
    sortedExpenses.forEach(expense => {
      const row = document.createElement('tr');
      row.dataset.id = expense.id;
      
      row.innerHTML = `
        <td><input type="checkbox" class="expense-checkbox" data-id="${expense.id}"></td>
        <td>${formatDate(expense.expense_date)}</td>
        <td>${expense.description}</td>
        <td>${expense.category || '<span class="text-muted">Uncategorized</span>'}</td>
        <td>${formatCurrency(expense.amount)}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-action edit-expense" data-id="${expense.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-action delete-expense" data-id="${expense.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addRowEventListeners();
  }
  
  // Add event listeners to table row buttons
  function addRowEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-expense').forEach(button => {
      button.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        showEditExpenseModal(id);
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-expense').forEach(button => {
      button.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        showDeleteConfirmation(id);
      });
    });
  }
  
  // Update summary section
  function updateSummary(summary, totalAmount) {
    const totalAmountElement = document.getElementById('total-amount');
    const categoryBreakdown = document.getElementById('category-breakdown');
    
    // Update total amount
    totalAmountElement.textContent = formatCurrency(totalAmount || 0);
    
    // Clear category breakdown
    categoryBreakdown.innerHTML = '';
    
    if (!summary || summary.length === 0) {
      categoryBreakdown.innerHTML = '<p class="text-muted">No data for the selected month</p>';
      return;
    }
    
    // Generate random colors for categories
    const colors = generateRandomColors(summary.length);
    
    // Create category progress bars
    summary.forEach((item, index) => {
      const percentage = calculatePercentage(item.total_amount, totalAmount);
      const div = document.createElement('div');
      div.className = 'category-progress';
      div.innerHTML = `
        <div class="d-flex justify-content-between">
          <span class="category-name">${item.category || 'Uncategorized'}</span>
          <span class="category-amount">${formatCurrency(item.total_amount)}</span>
        </div>
        <div class="progress">
          <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${colors[index]}"></div>
        </div>
        <small>${percentage}% of total (${item.transaction_count} transactions)</small>
      `;
      categoryBreakdown.appendChild(div);
    });
  }
  
  // Show modal for adding a new expense
  function showAddExpenseModal() {
    // Reset form
    const form = document.getElementById('expense-form');
    form.reset();
    
    // Set current date
    const dateInput = document.getElementById('expense-date');
    dateInput.value = formatDateForInput(new Date());
    
    // Update modal title
    const modalTitle = document.getElementById('expense-modal-title');
    modalTitle.textContent = 'Add Expense';
    
    // Clear expense ID
    document.getElementById('expense-id').value = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('expense-modal'));
    modal.show();
  }
  
  // Show modal for editing an expense
  async function showEditExpenseModal(id) {
    try {
      // Find expense in the array first to avoid extra API call
      let expense = expenses.find(e => e.id == id);
      
      // If not found (rare case), fetch from API
      if (!expense) {
        expense = await API.getExpense(id);
      }
      
      // Set form values
      document.getElementById('expense-id').value = expense.id;
      document.getElementById('expense-description').value = expense.description;
      document.getElementById('expense-amount').value = expense.amount;
      document.getElementById('expense-category').value = expense.category || '';
      document.getElementById('expense-date').value = formatDateForInput(expense.expense_date);
      
      // Update modal title
      const modalTitle = document.getElementById('expense-modal-title');
      modalTitle.textContent = 'Edit Expense';
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('expense-modal'));
      modal.show();
    } catch (error) {
      console.error('Failed to load expense details:', error);
      showToast('Error', 'Failed to load expense details', 'danger');
    }
  }
  
  // Handle saving an expense (create or update)
  async function handleSaveExpense() {
    // Get form values
    const id = document.getElementById('expense-id').value;
    const description = document.getElementById('expense-description').value;
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const expenseDate = document.getElementById('expense-date').value;
    
    // Validate form
    if (!description || !amount || !expenseDate) {
      showToast('Error', 'Please fill in all required fields', 'danger');
      return;
    }
    
    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        category,
        expenseDate
      };
      
      // Log the data being sent for debugging
      console.log('Sending expense data:', expenseData);
      
      let result;
      
      // Create or update based on whether we have an ID
      if (id) {
        result = await API.updateExpense(id, expenseData);
        showToast('Success', 'Expense updated successfully');
      } else {
        result = await API.createExpense(expenseData);
        showToast('Success', 'Expense added successfully');
      }
      
      console.log('Success response:', result);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('expense-modal'));
      modal.hide();
      
      // Reload expenses
      await loadExpenses();
    } catch (error) {
      // Enhanced error logging
      console.error('Failed to save expense:', error);
      let errorMessage = 'Failed to save expense';
      
      if (error.response) {
        try {
          // Try to parse error response
          const errorData = await error.response.json();
          errorMessage += `: ${errorData.error || error.message}`;
        } catch (e) {
          errorMessage += `: ${error.message || 'Unknown error'}`;
        }
      } else {
        errorMessage += `: ${error.message || 'Unknown error'}`;
      }
      
      showToast('Error', errorMessage, 'danger');
    }
  }
  
  // Show delete confirmation modal
  function showDeleteConfirmation(id) {
    // Store ID for later
    document.getElementById('confirm-delete').dataset.id = id;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('delete-modal'));
    modal.show();
  }
  
  // Handle expense deletion
  async function handleConfirmDelete() {
    const deleteButton = document.getElementById('confirm-delete');
    const id = deleteButton.dataset.id;
    
    if (!id) return;
    
    try {
      await API.deleteExpense(id);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('delete-modal'));
      modal.hide();
      
      // Reload expenses
      await loadExpenses();
      
      showToast('Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showToast('Error', 'Failed to delete expense', 'danger');
    }
  }
  
  // Handle month filter change
  async function handleMonthFilterChange(e) {
    const value = e.target.value;
    
    if (!value) return;
    
    const { year, month } = parseYearMonthInput(value);
    currentFilter = { year, month };
    
    await loadExpenses();
  }
  
  // Handle select all checkbox
  function handleSelectAllChange(e) {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.expense-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
    });
  }
  
  // Handle auto-categorization
  async function handleCategorize() {
    // Get selected expenses
    const checkboxes = document.querySelectorAll('.expense-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
    
    if (selectedIds.length === 0) {
      showToast('Warning', 'Please select at least one expense', 'warning');
      return;
    }
    
    try {
      // Show loading state
      checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        row.classList.add('categorizing');
      });
      
      // Call API to categorize
      const result = await API.categorizeExpenses(selectedIds);
      
      // Remove loading state
      document.querySelectorAll('.categorizing').forEach(row => {
        row.classList.remove('categorizing');
      });
      
      // Check results
      const successCount = result.results.filter(r => r.status === 'success').length;
      
      if (successCount > 0) {
        // Reload expenses to show updated categories
        await loadExpenses();
        
        showToast('Success', `${successCount} expense(s) categorized successfully`);
      } else {
        showToast('Warning', 'No expenses were categorized', 'warning');
      }
    } catch (error) {
      console.error('Failed to categorize expenses:', error);
      showToast('Error', 'Failed to categorize expenses', 'danger');
      
      // Remove loading state
      document.querySelectorAll('.categorizing').forEach(row => {
        row.classList.remove('categorizing');
      });
    }
  }
  
  // Public API
  return {
    init
  };
})();