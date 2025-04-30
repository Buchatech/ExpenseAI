/**
 * Monthly expense view module
 */

// Module for managing the monthly expense view
const MonthlyModule = (() => {
  // Private variables
  let expenses = [];
  let currentMonth = getCurrentYearMonth();
  
  // Cache DOM elements
  const mainContent = document.getElementById('main-content');
  
  // Initialize monthly view
  async function init() {
    // Clone template
    const template = document.getElementById('monthly-template');
    const content = template.content.cloneNode(true);
    
    // Clear main content and append template
    mainContent.innerHTML = '';
    mainContent.appendChild(content);
    
    // Setup event listeners
    setupEventListeners();
    
    // Set initial month filter value
    const monthFilter = document.getElementById('monthly-view-filter');
    monthFilter.value = formatYearMonthForInput(currentMonth.year, currentMonth.month);
    
    // Load data for the current month
    await loadMonthlyData();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Month filter change
    const monthFilter = document.getElementById('monthly-view-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', handleMonthFilterChange);
    }
  }
  
  // Handle month filter change
  async function handleMonthFilterChange(e) {
    const value = e.target.value;
    
    if (!value) return;
    
    const { year, month } = parseYearMonthInput(value);
    currentMonth = { year, month };
    
    await loadMonthlyData();
  }
  
  // Load monthly data
  async function loadMonthlyData() {
    try {
      console.log(`Loading monthly data for ${currentMonth.year}-${currentMonth.month}`);
      
      // Update month display
      const monthYearDisplay = document.getElementById('month-year-display');
      if (monthYearDisplay) {
        monthYearDisplay.textContent = formatMonthYear(currentMonth.year, currentMonth.month);
      }
      
      // Fetch summary data first
      let summaryData;
      try {
        summaryData = await API.getMonthlySummary(currentMonth.year, currentMonth.month);
        console.log('Monthly summary data successfully received:', summaryData);
        
        // Update summary and visualization
        updateSummary(summaryData);
        
        // Only create chart if the element exists and there's data
        const chartCanvas = document.getElementById('expense-chart');
        if (chartCanvas && typeof Chart !== 'undefined' && summaryData.summary && summaryData.summary.length > 0) {
          createChart(summaryData.summary);
        } else {
          console.log('Skipping chart creation - either no chart canvas, no Chart.js, or no data');
          if (!chartCanvas) console.log('Chart canvas not found in DOM');
          if (typeof Chart === 'undefined') console.log('Chart.js is not defined');
          if (!summaryData.summary || summaryData.summary.length === 0) console.log('No summary data available for chart');
        }
      } catch (summaryError) {
        console.error('Error fetching monthly summary:', summaryError);
        showToast('Warning', 'Could not load monthly summary', 'warning');
      }
      
      // Now fetch expenses data - continue even if summary failed
      try {
        const expensesData = await API.getExpensesByMonth(currentMonth.year, currentMonth.month);
        console.log('Monthly expenses data successfully received:', expensesData);
        
        // Render expenses
        renderExpenses(expensesData.expenses || []);
      } catch (expensesError) {
        console.error('Error fetching monthly expenses:', expensesError);
        showToast('Warning', 'Could not load monthly expenses', 'warning');
        // Still clear the table even if there was an error
        renderExpenses([]);
      }
      
    } catch (error) {
      console.error('Fatal error in loadMonthlyData:', error);
      showToast('Error', 'Failed to load monthly data', 'danger');
      
      // Try to show empty states even when errors occur
      const totalElement = document.getElementById('monthly-total');
      const summaryBody = document.getElementById('monthly-summary-body');
      const tableBody = document.getElementById('monthly-expenses-body');
      const noExpenses = document.getElementById('no-monthly-expenses');
      
      if (totalElement) totalElement.textContent = formatCurrency(0);
      if (summaryBody) summaryBody.innerHTML = '<tr><td colspan="3" class="text-center">Could not load data</td></tr>';
      if (tableBody) tableBody.innerHTML = '';
      if (noExpenses) noExpenses.style.display = 'block';
    }
  }
  
  // Update monthly summary
  function updateSummary(data) {
    const totalElement = document.getElementById('monthly-total');
    const summaryBody = document.getElementById('monthly-summary-body');
    
    if (!totalElement || !summaryBody) {
      console.error('Summary elements not found in DOM');
      return;
    }
    
    // Update total
    totalElement.textContent = formatCurrency(data.totalAmount || 0);
    
    // Clear previous summary
    summaryBody.innerHTML = '';
    
    if (!data.summary || data.summary.length === 0) {
      summaryBody.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
      return;
    }
    
    // Create rows for each category
    data.summary.forEach(item => {
      const row = document.createElement('tr');
      const percentage = calculatePercentage(item.total_amount, data.totalAmount);
      
      row.innerHTML = `
        <td>${item.category || 'Uncategorized'}</td>
        <td>${formatCurrency(item.total_amount)}</td>
        <td>${percentage}%</td>
      `;
      
      summaryBody.appendChild(row);
    });
  }
  
  // Create expense chart
  function createChart(summaryData) {
    const chartCanvas = document.getElementById('expense-chart');
    
    if (!chartCanvas) {
      console.error('Chart canvas element not found');
      return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // Clear any existing chart
    if (chartCanvas._chart) {
      chartCanvas._chart.destroy();
    }
    
    if (!summaryData || summaryData.length === 0) {
      return;
    }
    
    try {
      // Prepare data for chart
      const labels = summaryData.map(item => item.category || 'Uncategorized');
      const data = summaryData.map(item => parseFloat(item.total_amount));
      const backgroundColors = generateRandomColors(summaryData.length);
      
      // Create new chart
      const chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${formatCurrency(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      // Save reference to chart instance
      chartCanvas._chart = chart;
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }
  
  // Render expenses list
  function renderExpenses(expensesList) {
    const tableBody = document.getElementById('monthly-expenses-body');
    const noExpenses = document.getElementById('no-monthly-expenses');
    
    if (!tableBody || !noExpenses) {
      console.error('Monthly expenses elements not found in DOM');
      return;
    }
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    if (!expensesList || expensesList.length === 0) {
      noExpenses.style.display = 'block';
      return;
    }
    
    noExpenses.style.display = 'none';
    
    // Sort expenses by date (newest first)
    const sortedExpenses = sortExpensesByDate(expensesList);
    
    // Create rows for each expense
    sortedExpenses.forEach(expense => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${formatDate(expense.expense_date)}</td>
        <td>${expense.description}</td>
        <td>${expense.category || '<span class="text-muted">Uncategorized</span>'}</td>
        <td>${formatCurrency(expense.amount)}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  // Public API
  return {
    init
  };
})();