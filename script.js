</head>
<body>
    <!--*** Main page content ***-->
    <div class="container">
        <h1>Student Finance Pro 🎓💰</h1>
        
        <!--*** Instructions Section ***-->
        <div class="instructions">
            <div class="instructions-header" onclick="toggleInstructions()">
                <span>📚 Instructions</span>
                <span id="instructionsToggle">▼</span>
            </div>
            <div class="instructions-content" id="instructionsContent">
                <ul class="instructions-list">
                    <li>💾 <strong>Adding Transactions:</strong> Fill out the form with type, category, amount, date, and description, then click "Save Transaction"</li>
                    <li>✏️ <strong>Editing Transactions:</strong> Click the "Edit" button on any transaction to load it into the form for editing</li>
                    <li>🗑️ <strong>Deleting Transactions:</strong> Click the "Delete" button on any transaction to remove it (with confirmation)</li>
                    <li>🔍 <strong>Filtering Transactions:</strong> Use the search box and date range filters to find specific transactions</li>
                    <li>📤 <strong>Exporting Data:</strong> Click "Export CSV" to download all your transactions as a spreadsheet</li>
                    <li>📊 <strong>Viewing Reports:</strong> See visual breakdowns of your income and expenses in the charts below</li>
                    <li>🔄 <strong>Automatic Saving:</strong> All data is saved automatically in your browser</li>
                </ul>
            </div>
        </div>
        
        <!--*** Dashboard section ***-->
        <div class="dashboard">
            <div class="card">
                <h2>Current Balance: $<span id="currentBalance">0.00</span></h2>
            </div>
        </div>

        <!--*** Transaction entry form ***-->
        <div class="card">
            <div class="transaction-form">
                <select id="type" onchange="toggleCategories()">
                    <option value="Income">➕ Income</option>
                    <option value="Expense">➖ Expense</option>
                </select>
                
                <select id="category"></select>
                <input type="number" id="amount" placeholder="💵 Amount" step="0.01" min="0">
                <input type="date" id="date">
                <input type="text" id="description" placeholder="📝 Description">
                <button onclick="handleTransaction()">💾 Save Transaction</button>
            </div>
        </div>

        <!--*** Transaction filtering controls ***-->
        <div class="search-filter">
            <input type="text" id="search" placeholder="🔍 Search by description or category..." onkeyup="filterTransactions()">
            <input type="date" id="startDate" onchange="filterTransactions()">
            <input type="date" id="endDate" onchange="filterTransactions()">
            <button onclick="exportCSV()" style="background:var(--secondary)">📤 Export CSV</button>
        </div>

        <!--*** Transactions table ***-->
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="transactionList"></tbody>
            </table>
        </div>

        <!--*** Data visualization section ***-->
        <div class="chart-container">
            <div class="card">
                <h3>📊 Income Breakdown</h3>
                <canvas id="incomeChart"></canvas>
            </div>
            <div class="card">
                <h3>📈 Expense Analysis</h3>
                <canvas id="expenseChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        // *** Application State ***
        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let editingIndex = -1;  // Track transaction being edited
        let incomeChart, expenseChart;  // Chart.js instances

        // *** Transaction Categories ***
        const CATEGORIES = {
            Income: ['Salary', 'Scholarship', 'Freelance', 'Other Income'],
            Expense: ['Food', 'Housing', 'Transportation', 'Books', 'Entertainment', 'Other']
        };

        // *** Initialize date inputs to current date ***
        document.getElementById('date').max = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').max = new Date().toISOString().split('T')[0];
        document.getElementById('endDate').max = new Date().toISOString().split('T')[0];

        // *** Toggle instructions visibility ***
        function toggleInstructions() {
            const content = document.getElementById('instructionsContent');
            const toggle = document.getElementById('instructionsToggle');
            content.classList.toggle('show');
            toggle.textContent = content.classList.contains('show') ? '▲' : '▼';
        }

        // *** Populate category dropdown based on transaction type ***
        function toggleCategories() {
            const type = document.getElementById('type').value;
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = CATEGORIES[type].map(c => 
                `<option value="${c}">${c}</option>`
            ).join('');
        }

        // *** Calculate current balance from transactions ***
        function calculateBalance() {
            return transactions.reduce((acc, transaction) => {
                return transaction.type === 'Income' 
                    ? acc + parseFloat(transaction.amount)
                    : acc - parseFloat(transaction.amount);
            }, 0).toFixed(2);
        }

        // *** Handle transaction form submission ***
        function handleTransaction() {
            const transaction = {
                type: document.getElementById('type').value,
                category: document.getElementById('category').value,
                amount: parseFloat(document.getElementById('amount').value),
                date: document.getElementById('date').value,
                description: document.getElementById('description').value.trim()
            };

            // *** Form validation ***
            if (!transaction.amount || transaction.amount <= 0 || !transaction.date || !transaction.description) {
                alert('Please fill all fields with valid values!');
                return;
            }

            // *** Add new or update existing transaction ***
            if (editingIndex === -1) {
                transactions.push(transaction);
            } else {
                transactions[editingIndex] = transaction;
                editingIndex = -1;
            }

            // *** Persist to localStorage ***
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();
            // *** Clear form fields ***
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
        }

        // *** Update all UI elements ***
        function updateUI() {
            // *** Update balance display ***
            document.getElementById('currentBalance').textContent = calculateBalance();
            
            // *** Update transactions table ***
            const tbody = document.getElementById('transactionList');
            tbody.innerHTML = transactions.map((t, index) => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.type}</td>
                    <td>${t.category}</td>
                    <td class="${t.type === 'Income' ? 'positive' : 'negative'}">
                        $${t.amount.toFixed(2)}
                    </td>
                    <td>${t.description}</td>
                    <td>
                        <button onclick="editTransaction(${index})">✏️ Edit</button>
                        <button onclick="deleteTransaction(${index})" style="background:var(--error)">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');
            
            updateCharts();  // Refresh data visualizations
        }

        // *** Edit existing transaction ***
        function editTransaction(index) {
            const t = transactions[index];
            document.getElementById('type').value = t.type;
            toggleCategories();  // Update category dropdown
            // *** Small delay to ensure categories are loaded ***
            setTimeout(() => document.getElementById('category').value = t.category, 10);
            document.getElementById('amount').value = t.amount;
            document.getElementById('date').value = t.date;
            document.getElementById('description').value = t.description;
            editingIndex = index;
        }

        // *** Delete transaction with confirmation ***
        function deleteTransaction(index) {
            if(confirm('Delete this transaction?')) {
                transactions.splice(index, 1);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                updateUI();
            }
        }

        // *** Update chart visualizations***
        function updateCharts() {
            const incomeData = transactions.filter(t => t.type === 'Income');
            const expenseData = transactions.filter(t => t.type === 'Expense');

            // *** Destroy existing charts before recreating ***
            if (incomeChart) incomeChart.destroy();
            if (expenseChart) expenseChart.destroy();

            // *** Create income pie chart ***
            incomeChart = new Chart(document.getElementById('incomeChart'), {
                type: 'pie',
                data: {
                    labels: [...new Set(incomeData.map(t => t.category))],
                    datasets: [{
                        data: [...new Set(incomeData.map(t => t.category))].map(c => 
                            incomeData.filter(t => t.category === c).reduce((a, b) => a + b.amount, 0)
                        ),
                        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63']
                    }]
                },
                options: {
                    plugins: {
                        legend: { position: 'right' }
                    },
                    radius: '60%' 
                }
            });

            // *** Expense pie chart ***
            expenseChart = new Chart(document.getElementById('expenseChart'), {
                type: 'pie',// Chart Type
                data: {
                    labels: [...new Set(expenseData.map(t => t.category))],// Unique Categories
                    datasets: [{
                        data: [...new Set(expenseData.map(t => t.category))].map(c => // Filter By Categories
                            expenseData.filter(t => t.category === c).reduce((a, b) => a + b.amount, 0) //Sum Of Categories
                        ),
                        backgroundColor: ['#E91E63', '#9C27B0', '#3F51B5', '#009688'] //Slice Colors
                    }]
                },
                options: {
                    plugins: {
                        legend: { position: 'right' } //Legend Placement
                    },
                    radius: '60%' //Chart size
                }
            });
        }

        // *** Enhanced filter transactions function ***
        function filterTransactions() {
            // Get User Inputs
            const search = document.getElementById('search').value.toLowerCase();
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            
            const filtered = transactions.filter(t => 
                (t.description.toLowerCase().includes(search) || // Search By Description
                 t.category.toLowerCase().includes(search)) &&  // OR Search By Category
                (!start || t.date >= start) && // After Start Date
                (!end || t.date <= end) // Before End Date
            );
            
            document.getElementById('transactionList').innerHTML = filtered.map((t, i) => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.type}</td>
                    <td>${t.category}</td>
                    <td class="${t.type === 'Income' ? 'positive' : 'negative'}">
                        $${t.amount.toFixed(2)}
                    </td>
                    <td>${t.description}</td>
                    <td>
                        <button onclick="editTransaction(${transactions.indexOf(t)})">✏️ Edit</button>
                        <button onclick="deleteTransaction(${transactions.indexOf(t)})" style="background:var(--error)">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // *** Export transactions to CSV file ***
        function exportCSV() {
            const csv = [
                ['Date', 'Type', 'Category', 'Amount', 'Description'].join(','),
                ...transactions.map(t => [t.date, t.type, t.category, t.amount, t.description].join(','))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.csv';
            a.click();
        }

        // *** Initial setup ***
        toggleCategories();  // Initialize category dropdown
        updateUI();          // Load initial data
    </script>
</body>
</html>
