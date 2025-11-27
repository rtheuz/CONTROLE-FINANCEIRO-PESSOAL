/**
 * Controle Financeiro Pessoal - JavaScript Application
 * =====================================================
 * Um aplicativo completo para controle de gastos pessoais
 * com dashboards e relatórios.
 */

// ==========================================
// DATA MANAGEMENT
// ==========================================

const STORAGE_KEY = 'controle_financeiro_dados';

// Category configurations with icons and labels
const CATEGORIES = {
    expense: {
        'alimentacao': { icon: '🍔', label: 'Alimentação' },
        'transporte': { icon: '🚗', label: 'Transporte' },
        'moradia': { icon: '🏠', label: 'Moradia' },
        'saude': { icon: '💊', label: 'Saúde' },
        'educacao': { icon: '📚', label: 'Educação' },
        'lazer': { icon: '🎮', label: 'Lazer' },
        'compras': { icon: '🛒', label: 'Compras' },
        'outros-despesa': { icon: '📦', label: 'Outros' }
    },
    income: {
        'salario': { icon: '💼', label: 'Salário' },
        'freelance': { icon: '💻', label: 'Freelance' },
        'investimentos': { icon: '📊', label: 'Investimentos' },
        'outros-receita': { icon: '💰', label: 'Outros' }
    }
};

// Load data from localStorage
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { transactions: [] };
}

// Save data to localStorage
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ==========================================
// TRANSACTION OPERATIONS
// ==========================================

function addTransaction(transaction) {
    const data = loadData();
    transaction.id = generateId();
    transaction.createdAt = new Date().toISOString();
    data.transactions.unshift(transaction);
    saveData(data);
    return transaction;
}

function deleteTransaction(id) {
    const data = loadData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveData(data);
}

function getTransactions(filters = {}) {
    const data = loadData();
    let transactions = [...data.transactions];
    
    if (filters.month) {
        transactions = transactions.filter(t => t.date.startsWith(filters.month));
    }
    
    if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate);
    }
    
    if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate);
    }
    
    if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type);
    }
    
    if (filters.category && filters.category !== 'all') {
        transactions = transactions.filter(t => t.category === filters.category);
    }
    
    return transactions;
}

// ==========================================
// CALCULATIONS
// ==========================================

function calculateTotals(transactions) {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
        income,
        expense,
        balance: income - expense
    };
}

function calculateByCategory(transactions, type) {
    const filtered = transactions.filter(t => t.type === type);
    const byCategory = {};
    
    filtered.forEach(t => {
        if (!byCategory[t.category]) {
            byCategory[t.category] = 0;
        }
        byCategory[t.category] += parseFloat(t.amount);
    });
    
    return byCategory;
}

function calculateMonthlyData(transactions) {
    const monthlyData = {};
    
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        monthlyData[month][t.type] += parseFloat(t.amount);
    });
    
    return monthlyData;
}

// ==========================================
// FORMATTING UTILITIES
// ==========================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    // Parse date string in YYYY-MM-DD format safely
    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return dateString;
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR');
}

function getCategoryInfo(type, category) {
    return CATEGORIES[type]?.[category] || { icon: '📋', label: category };
}

// ==========================================
// UI RENDERING
// ==========================================

function updateDashboardCards() {
    const transactions = getTransactions();
    const totals = calculateTotals(transactions);
    
    document.getElementById('total-income').textContent = formatCurrency(totals.income);
    document.getElementById('total-expense').textContent = formatCurrency(totals.expense);
    
    const balanceElement = document.getElementById('total-balance');
    balanceElement.textContent = formatCurrency(totals.balance);
    balanceElement.style.color = totals.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
}

function renderTransactionsList(filters = {}) {
    const transactions = getTransactions(filters);
    const container = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum lançamento encontrado.</p>';
        return;
    }
    
    container.innerHTML = transactions.map(t => {
        const categoryInfo = getCategoryInfo(t.type, t.category);
        return `
            <div class="transaction-item" data-id="${t.id}">
                <div class="transaction-info">
                    <span class="transaction-icon">${categoryInfo.icon}</span>
                    <div class="transaction-details">
                        <span class="transaction-description">${escapeHtml(t.description)}</span>
                        <span class="transaction-category">${categoryInfo.label}</span>
                        <span class="transaction-date">${formatDate(t.date)}</span>
                    </div>
                </div>
                <div class="transaction-actions">
                    <span class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
                    </span>
                    <button class="delete-btn" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// CHARTS
// ==========================================

let expensesChart = null;
let incomeChart = null;
let monthlyChart = null;

const CHART_COLORS = [
    '#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#2ecc71', '#3498db', '#e74c3c'
];

// Check if Chart.js is available
function isChartAvailable() {
    return typeof Chart !== 'undefined';
}

function renderCharts() {
    const transactions = getTransactions();
    
    if (isChartAvailable()) {
        renderExpensesChart(transactions);
        renderIncomeChart(transactions);
        renderMonthlyChart(transactions);
    } else {
        renderFallbackCharts(transactions);
    }
}

// Fallback rendering when Chart.js is not available
function renderFallbackCharts(transactions) {
    const expensesByCategory = calculateByCategory(transactions, 'expense');
    const incomeByCategory = calculateByCategory(transactions, 'income');
    const monthlyData = calculateMonthlyData(transactions);
    
    // Render expenses fallback
    const expensesContainer = document.getElementById('expenses-chart').parentElement;
    expensesContainer.innerHTML = '<h3>Despesas por Categoria</h3>' + renderFallbackTable(expensesByCategory, 'expense');
    
    // Render income fallback
    const incomeContainer = document.getElementById('income-chart').parentElement;
    incomeContainer.innerHTML = '<h3>Receitas por Categoria</h3>' + renderFallbackTable(incomeByCategory, 'income');
    
    // Render monthly fallback
    const monthlyContainer = document.getElementById('monthly-chart').parentElement;
    monthlyContainer.innerHTML = '<h3>Evolução Mensal</h3>' + renderMonthlyFallbackTable(monthlyData);
}

function renderFallbackTable(data, type) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
        return '<p class="empty-state">Nenhum dado disponível.</p>';
    }
    
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    
    let html = '<div class="fallback-chart">';
    entries.forEach(([category, value], index) => {
        const categoryInfo = getCategoryInfo(type, category);
        const percentage = ((value / total) * 100).toFixed(1);
        const color = CHART_COLORS[index % CHART_COLORS.length];
        
        html += `
            <div class="fallback-bar-container">
                <div class="fallback-bar-label">
                    <span>${categoryInfo.icon} ${categoryInfo.label}</span>
                    <span>${formatCurrency(value)} (${percentage}%)</span>
                </div>
                <div class="fallback-bar-bg">
                    <div class="fallback-bar" style="width: ${percentage}%; background: ${color};"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

function renderMonthlyFallbackTable(monthlyData) {
    const sortedMonths = Object.keys(monthlyData).sort();
    
    if (sortedMonths.length === 0) {
        return '<p class="empty-state">Nenhum dado disponível.</p>';
    }
    
    let html = '<table class="report-table"><thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>';
    
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const income = monthlyData[month].income;
        const expense = monthlyData[month].expense;
        const balance = income - expense;
        
        html += `
            <tr>
                <td>${monthLabel}</td>
                <td class="income">${formatCurrency(income)}</td>
                <td class="expense">${formatCurrency(expense)}</td>
                <td class="${balance >= 0 ? 'income' : 'expense'}">${formatCurrency(balance)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function renderExpensesChart(transactions) {
    const byCategory = calculateByCategory(transactions, 'expense');
    const labels = Object.keys(byCategory).map(key => getCategoryInfo('expense', key).label);
    const data = Object.values(byCategory);
    
    const ctx = document.getElementById('expenses-chart').getContext('2d');
    
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: CHART_COLORS,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function renderIncomeChart(transactions) {
    const byCategory = calculateByCategory(transactions, 'income');
    const labels = Object.keys(byCategory).map(key => getCategoryInfo('income', key).label);
    const data = Object.values(byCategory);
    
    const ctx = document.getElementById('income-chart').getContext('2d');
    
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: CHART_COLORS,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function renderMonthlyChart(transactions) {
    const monthlyData = calculateMonthlyData(transactions);
    const sortedMonths = Object.keys(monthlyData).sort();
    
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });
    
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expense);
    
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: '#27ae60',
                    borderRadius: 5
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: '#e74c3c',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// REPORTS
// ==========================================

function populateReportCategories() {
    const select = document.getElementById('report-category');
    select.innerHTML = '<option value="all">Todas</option>';
    
    const expenseGroup = document.createElement('optgroup');
    expenseGroup.label = 'Despesas';
    Object.entries(CATEGORIES.expense).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.icon + ' ' + value.label;
        expenseGroup.appendChild(option);
    });
    
    const incomeGroup = document.createElement('optgroup');
    incomeGroup.label = 'Receitas';
    Object.entries(CATEGORIES.income).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.icon + ' ' + value.label;
        incomeGroup.appendChild(option);
    });
    
    select.appendChild(expenseGroup);
    select.appendChild(incomeGroup);
}

function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const type = document.getElementById('report-type').value;
    const category = document.getElementById('report-category').value;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;
    if (category) filters.category = category;
    
    const transactions = getTransactions(filters);
    const totals = calculateTotals(transactions);
    
    // Update summary
    document.getElementById('report-income').textContent = formatCurrency(totals.income);
    document.getElementById('report-expense').textContent = formatCurrency(totals.expense);
    
    const balanceElement = document.getElementById('report-balance');
    balanceElement.textContent = formatCurrency(totals.balance);
    balanceElement.className = 'summary-value ' + (totals.balance >= 0 ? 'income' : 'expense');
    
    // Update table
    const tbody = document.getElementById('report-table-body');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(t => {
        const categoryInfo = getCategoryInfo(t.type, t.category);
        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                <td>${categoryInfo.icon} ${categoryInfo.label}</td>
                <td>${escapeHtml(t.description)}</td>
                <td class="${t.type}">${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}</td>
            </tr>
        `;
    }).join('');
}

function exportToCSV() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const type = document.getElementById('report-type').value;
    const category = document.getElementById('report-category').value;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;
    if (category) filters.category = category;
    
    const transactions = getTransactions(filters);
    
    if (transactions.length === 0) {
        showNotification('Não há dados para exportar.', 'error');
        return;
    }
    
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
    const rows = transactions.map(t => {
        const categoryInfo = getCategoryInfo(t.type, t.category);
        return [
            formatDate(t.date),
            t.type === 'income' ? 'Receita' : 'Despesa',
            categoryInfo.label,
            t.description,
            t.amount.toString().replace('.', ',')
        ];
    });
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(';'))
        .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Relatório exportado com sucesso!', 'success');
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            
            if (btn.dataset.tab === 'dashboard') {
                renderCharts();
            }
        });
    });
    
    // Transaction form
    const form = document.getElementById('transaction-form');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    // Update categories based on type selection
    typeSelect.addEventListener('change', () => {
        const type = typeSelect.value;
        const optgroups = categorySelect.querySelectorAll('optgroup');
        
        optgroups.forEach(group => {
            const options = group.querySelectorAll('option');
            options.forEach(option => option.style.display = 'block');
        });
        
        // Show relevant categories
        if (type === 'expense') {
            categorySelect.querySelector('#income-categories').style.display = 'none';
            categorySelect.querySelector('#expense-categories').style.display = 'block';
            categorySelect.value = 'alimentacao';
        } else {
            categorySelect.querySelector('#expense-categories').style.display = 'none';
            categorySelect.querySelector('#income-categories').style.display = 'block';
            categorySelect.value = 'salario';
        }
    });
    
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const transaction = {
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value),
            date: document.getElementById('date').value,
            description: document.getElementById('description').value.trim()
        };
        
        addTransaction(transaction);
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
        
        updateDashboardCards();
        renderTransactionsList();
        showNotification('Lançamento adicionado com sucesso!', 'success');
    });
    
    // Filter by month
    document.getElementById('filter-month').addEventListener('change', (e) => {
        renderTransactionsList({ month: e.target.value });
    });
    
    document.getElementById('clear-filter').addEventListener('click', () => {
        document.getElementById('filter-month').value = '';
        renderTransactionsList();
    });
    
    // Delete transaction
    let transactionToDelete = null;
    const deleteModal = document.getElementById('delete-modal');
    
    document.getElementById('transactions-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            transactionToDelete = e.target.closest('.transaction-item').dataset.id;
            deleteModal.classList.add('active');
        }
    });
    
    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.classList.remove('active');
        transactionToDelete = null;
    });
    
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (transactionToDelete) {
            deleteTransaction(transactionToDelete);
            updateDashboardCards();
            renderTransactionsList();
            showNotification('Lançamento excluído!', 'success');
        }
        deleteModal.classList.remove('active');
        transactionToDelete = null;
    });
    
    // Close modal on outside click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.remove('active');
            transactionToDelete = null;
        }
    });
    
    // Reports
    document.getElementById('generate-report').addEventListener('click', generateReport);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // Set default report dates (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('report-start-date').valueAsDate = firstDayOfMonth;
    document.getElementById('report-end-date').valueAsDate = today;
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateDashboardCards();
    renderTransactionsList();
    populateReportCategories();
    
    // Add some sample data if empty
    const data = loadData();
    if (data.transactions.length === 0) {
        // Add sample transactions for demonstration
        const sampleTransactions = [
            { type: 'income', category: 'salario', amount: 5000, date: getDateString(-30), description: 'Salário mensal' },
            { type: 'expense', category: 'moradia', amount: 1500, date: getDateString(-28), description: 'Aluguel' },
            { type: 'expense', category: 'alimentacao', amount: 450, date: getDateString(-25), description: 'Supermercado' },
            { type: 'expense', category: 'transporte', amount: 200, date: getDateString(-20), description: 'Combustível' },
            { type: 'income', category: 'freelance', amount: 800, date: getDateString(-15), description: 'Projeto web' },
            { type: 'expense', category: 'lazer', amount: 150, date: getDateString(-10), description: 'Cinema e jantar' },
            { type: 'expense', category: 'saude', amount: 100, date: getDateString(-5), description: 'Farmácia' },
            { type: 'expense', category: 'educacao', amount: 200, date: getDateString(-2), description: 'Curso online' }
        ];
        
        sampleTransactions.forEach(t => addTransaction(t));
        updateDashboardCards();
        renderTransactionsList();
    }
});

function getDateString(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}
