let currentPage = 1;
const itemsPerPage = 10;
let currentMonth = 3;

// Fetch transaction data
async function fetchTransactions(month, page = 1, searchQuery = '') {
    try {
        const response = await fetch(`http://localhost:5000/api/transactions?month=${month}&page=${page}&search=${searchQuery}`);
        const data = await response.json();
        return data.transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

// Fetch statistics data
async function fetchStatistics(month) {
    try {
        const response = await fetch(`http://localhost:5000/api/statistics?month=${month}`);
        const data = await response.json();
        return {
            totalSales: data.totalSaleAmount || 0,
            soldItems: data.totalItemsSold || 0,
            notSoldItems: data.totalItemsNotSold || 0
        };
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
}

// Fetch bar chart data
async function fetchBarChartData(month) {
    try {
        const response = await fetch(`http://localhost:5000/api/price-range?month=${month}`);
        const data = await response.json();
        return {
            priceRanges: data.map(range => range.range),
            itemsInRange: data.map(range => range.count)
        };
    } catch (error) {
        console.error('Error fetching bar chart data:', error);
    }
}

// Render transactions
function renderTransactions(transactions) {
    const transactionsBody = document.getElementById('transactions-body');
    transactionsBody.innerHTML = '';
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.dateOfSale).toLocaleDateString()}</td>
            <td>${transaction.title}</td>
            <td>${transaction.description}</td>
            <td>$${transaction.price}</td>
        `;
        transactionsBody.appendChild(row);
    });
}

// Render statistics
function renderStatistics(stats) {
    document.getElementById('total-sales').innerText = `$${stats.totalSales}`;
    document.getElementById('sold-items').innerText = stats.soldItems;
    document.getElementById('not-sold-items').innerText = stats.notSoldItems;
}

// Render bar chart
function renderBarChart(data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.priceRanges,
            datasets: [{
                label: 'Number of Items',
                data: data.itemsInRange,
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initial data load
async function loadInitialData() {
    const transactions = await fetchTransactions(currentMonth, currentPage);
    renderTransactions(transactions);

    const stats = await fetchStatistics(currentMonth);
    renderStatistics(stats);

    const chartData = await fetchBarChartData(currentMonth);
    renderBarChart(chartData);
}

// Event listeners
document.getElementById('month').addEventListener('change', async (event) => {
    currentMonth = event.target.value;
    currentPage = 1;
    await loadInitialData();
});

document.getElementById('search').addEventListener('input', async (event) => {
    const searchQuery = event.target.value;
    const transactions = await fetchTransactions(currentMonth, currentPage, searchQuery);
    renderTransactions(transactions);
});

document.getElementById('prev-page').addEventListener('click', async () => {
    if (currentPage > 1) {
        currentPage--;
        await loadInitialData();
    }
});

document.getElementById('next-page').addEventListener('click', async () => {
    currentPage++;
    await loadInitialData();
});

// Load initial data on page load
window.onload = loadInitialData;
