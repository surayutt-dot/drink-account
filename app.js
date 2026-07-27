// State Management
let transactions = JSON.parse(localStorage.getItem('beverage_shop_txs')) || [];

// Default Configurations
const defaultCategories = [
    { id: 'tea', name: 'ชานม/ชาเขียว', icon: '🍵', type: 'income' },
    { id: 'coffee', name: 'กาแฟ', icon: '☕', type: 'income' },
    { id: 'fruit', name: 'น้ำผลไม้/โซดา', icon: '🍊', type: 'income' },
    { id: 'milk', name: 'นม/โกโก้', icon: '🥛', type: 'income' },
    { id: 'rent', name: 'ค่าเช่า/ค่าน้ำไฟ', icon: '🏠', type: 'expense' },
    { id: 'ingredient', name: 'วัตถุดิบ (ผลไม้/น้ำเชื่อม)', icon: '🍋', type: 'expense' },
    { id: 'packaging', name: 'บรรจุภัณฑ์ (แก้ว/หลอด)', icon: '🥤', type: 'expense' },
    { id: 'other_inc', name: 'รายรับอื่นๆ', icon: '💰', type: 'income' },
    { id: 'other_exp', name: 'รายจ่ายอื่นๆ', icon: '📦', type: 'expense' }
];

const defaultQuickBtns = [
    { id: 'q1', label: 'ขายชา (+40)', type: 'income', category: 'tea', amount: '40', icon: '🍵' },
    { id: 'q2', label: 'ขายกาแฟ (+50)', type: 'income', category: 'coffee', amount: '50', icon: '☕' },
    { id: 'q3', label: 'ซื้อวัตถุดิบ', type: 'expense', category: 'ingredient', amount: '', icon: '🍋' },
    { id: 'q4', label: 'ซื้อแก้ว/หลอด', type: 'expense', category: 'packaging', amount: '', icon: '🥤' }
];

let categories = JSON.parse(localStorage.getItem('beverage_shop_categories')) || defaultCategories;
let quickBtns = JSON.parse(localStorage.getItem('beverage_shop_quick_btns')) || defaultQuickBtns;

// DOM Elements
const balanceAmountEl = document.getElementById('balance-amount');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const transactionListEl = document.getElementById('transaction-list');
const dailySummaryListEl = document.getElementById('daily-summary-list');
const monthlyListEl = document.getElementById('monthly-list');
const txModal = document.getElementById('tx-modal');
const settingsModal = document.getElementById('settings-modal');
const txForm = document.getElementById('tx-form');
const themeToggleBtn = document.getElementById('theme-toggle');

// Quick Add & Category Setup
const quickAddGrid = document.getElementById('quick-add-grid');
const txCategorySelect = document.getElementById('tx-category');
const settingsQuickBtnsList = document.getElementById('settings-quick-btns-list');
const settingsCategoriesList = document.getElementById('settings-categories-list');
const newQuickBtnCategorySelect = document.getElementById('new-q-category');

// Navigation Tabs
const tabToday = document.getElementById('tab-today');
const tabDaily = document.getElementById('tab-daily');
const tabMonthly = document.getElementById('tab-monthly');
const sectionToday = document.getElementById('section-today');
const sectionDaily = document.getElementById('section-daily');
const sectionMonthly = document.getElementById('section-monthly');

// Form Inputs
const inputTypeIncome = document.getElementById('type-income');
const inputTypeExpense = document.getElementById('type-expense');
const inputAmount = document.getElementById('tx-amount');
const inputDescription = document.getElementById('tx-desc');
const inputDate = document.getElementById('tx-date');
let selectedType = 'income';

// Theme management
if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.innerText = '☀️';
} else {
    themeToggleBtn.innerText = '🌙';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggleBtn.innerText = isDark ? '☀️' : '🌙';
    localStorage.setItem('dark-mode', isDark ? 'enabled' : 'disabled');
});

// Setup Form Type Buttons
inputTypeIncome.addEventListener('click', () => {
    selectedType = 'income';
    inputTypeIncome.classList.add('selected');
    inputTypeExpense.classList.remove('selected');
    renderCategoryDropdowns();
});

inputTypeExpense.addEventListener('click', () => {
    selectedType = 'expense';
    inputTypeExpense.classList.add('selected');
    inputTypeIncome.classList.remove('selected');
    renderCategoryDropdowns();
});

// Tab Switching
tabToday.addEventListener('click', () => {
    tabToday.classList.add('active');
    tabDaily.classList.remove('active');
    tabMonthly.classList.remove('active');
    sectionToday.classList.add('active');
    sectionDaily.classList.remove('active');
    sectionMonthly.classList.remove('active');
    render();
});

tabDaily.addEventListener('click', () => {
    tabDaily.classList.add('active');
    tabToday.classList.remove('active');
    tabMonthly.classList.remove('active');
    sectionDaily.classList.add('active');
    sectionToday.classList.remove('active');
    sectionMonthly.classList.remove('active');
    renderDailySummary();
});

tabMonthly.addEventListener('click', () => {
    tabMonthly.classList.add('active');
    tabToday.classList.remove('active');
    tabDaily.classList.remove('active');
    sectionMonthly.classList.add('active');
    sectionToday.classList.remove('active');
    sectionDaily.classList.remove('active');
    renderMonthlySummary();
});

// Settings Modal Control
window.openSettingsModal = function() {
    renderSettingsLists();
    settingsModal.classList.add('active');
};

window.closeSettingsModal = function() {
    settingsModal.classList.remove('active');
};

// Open Transaction Modal
window.openModal = function(type = 'income', presetCategory = '', presetDesc = '', presetAmount = '') {
    // Set default date to today
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    inputDate.value = localISOTime;

    selectedType = type;
    if (type === 'income') {
        inputTypeIncome.classList.add('selected');
        inputTypeExpense.classList.remove('selected');
    } else {
        inputTypeExpense.classList.add('selected');
        inputTypeIncome.classList.remove('selected');
    }

    renderCategoryDropdowns();

    inputAmount.value = presetAmount;
    
    // Find default category
    const filteredCats = categories.filter(c => c.type === type);
    const defaultCatVal = filteredCats.length > 0 ? filteredCats[0].id : '';
    
    txCategorySelect.value = presetCategory || defaultCatVal;
    inputDescription.value = presetDesc;

    txModal.classList.add('active');
};

window.closeModal = function() {
    txModal.classList.remove('active');
    txForm.reset();
};

// Form Submit (Transaction)
txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(inputAmount.value);
    const categoryId = txCategorySelect.value;
    const categoryObj = categories.find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name : 'อื่นๆ';
    const description = inputDescription.value.trim() || categoryName;
    const date = inputDate.value;

    if (isNaN(amount) || amount <= 0) {
        alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
        return;
    }

    const transaction = {
        id: Date.now().toString(),
        type: selectedType,
        amount,
        category: categoryId,
        description,
        date,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    transactions.unshift(transaction);
    saveTransactions();
    closeModal();
    render();
    renderDailySummary();
    renderMonthlySummary();
});

// Delete Transaction
window.deleteTransaction = function(id) {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
        transactions = transactions.filter(tx => tx.id !== id);
        saveTransactions();
        render();
        renderDailySummary();
        renderMonthlySummary();
    }
};

// --- DATA MANAGEMENT FUNCTIONS ---

function saveTransactions() {
    localStorage.setItem('beverage_shop_txs', JSON.stringify(transactions));
}

function saveCategories() {
    localStorage.setItem('beverage_shop_categories', JSON.stringify(categories));
}

function saveQuickBtns() {
    localStorage.setItem('beverage_shop_quick_btns', JSON.stringify(quickBtns));
}

// Render dynamic parts
function renderCategoryDropdowns() {
    // 1. Transaction Modal category dropdown (filtered by income/expense type)
    const filteredCats = categories.filter(c => c.type === selectedType);
    txCategorySelect.innerHTML = filteredCats.map(c => `
        <option value="${c.id}">${c.icon} ${c.name}</option>
    `).join('');

    // 2. Settings Modal quick-button creator category dropdown (all categories)
    newQuickBtnCategorySelect.innerHTML = categories.map(c => `
        <option value="${c.id}">${c.type === 'income' ? 'รายรับ' : 'รายจ่าย'}: ${c.icon} ${c.name}</option>
    `).join('');
}

function renderQuickAddGrid() {
    if (quickBtns.length === 0) {
        quickAddGrid.innerHTML = `
            <div style="grid-column: span 4; text-align: center; font-size: 12px; opacity: 0.6; padding: 10px;">
                ไม่มีปุ่มบันทึกด่วน (ตั้งค่าได้ที่เฟืองมุมบน)
            </div>
        `;
        return;
    }

    quickAddGrid.innerHTML = quickBtns.map(btn => {
        const categoryObj = categories.find(c => c.id === btn.category) || { name: btn.label };
        return `
            <div class="quick-btn" onclick="openModal('${btn.type}', '${btn.category}', '${btn.label}', '${btn.amount}')">
                <span class="quick-icon">${btn.icon || '🥤'}</span>
                <span class="quick-label">${btn.label}</span>
            </div>
        `;
    }).join('');
}

function renderSettingsLists() {
    renderCategoryDropdowns();

    // Render Quick Buttons list in Settings
    settingsQuickBtnsList.innerHTML = quickBtns.map(btn => {
        const categoryObj = categories.find(c => c.id === btn.category) || { name: '-' };
        const typeStr = btn.type === 'income' ? 'รายรับ (+)' : 'รายจ่าย (-)';
        const amountStr = btn.amount ? `฿${btn.amount}` : 'กรอกเอง';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg-light); border: 1px solid rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 10px; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${btn.icon}</span>
                    <strong style="color: var(--text-light);">${btn.label}</strong>
                    <span style="opacity: 0.7; font-size: 11px;">(${typeStr} / ${amountStr})</span>
                </div>
                <button type="button" onclick="deleteQuickBtn('${btn.id}')" style="background: none; border: none; color: red; cursor: pointer; font-size: 14px;">🗑️</button>
            </div>
        `;
    }).join('');

    // Render Categories list in Settings
    settingsCategoriesList.innerHTML = categories.map(cat => {
        const typeStr = cat.type === 'income' ? 'รายรับ' : 'รายจ่าย';
        const color = cat.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg-light); border: 1px solid rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 10px; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${cat.icon}</span>
                    <strong style="color: var(--text-light);">${cat.name}</strong>
                    <span style="color: ${color}; font-size: 11px; font-weight: 600;">(${typeStr})</span>
                </div>
                <button type="button" onclick="deleteCategory('${cat.id}')" style="background: none; border: none; color: red; cursor: pointer; font-size: 14px;">🗑️</button>
            </div>
        `;
    }).join('');
}

// --- SETTINGS CONTROLS ---

// Add Category
document.getElementById('add-category-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim();
    const type = document.getElementById('new-cat-type').value;
    const id = 'cat_' + Date.now();

    if (!name || !icon) return;

    categories.push({ id, name, icon, type });
    saveCategories();
    document.getElementById('add-category-form').reset();
    renderSettingsLists();
    renderQuickAddGrid();
    render();
});

// Delete Category
window.deleteCategory = function(id) {
    if (confirm('การลบหมวดหมู่อาจส่งผลต่อปุ่มบันทึกด่วนที่เชื่อมโยงอยู่ ยืนยันลบหรือไม่?')) {
        categories = categories.filter(c => c.id !== id);
        // Also remove/clean quick buttons linked to this category
        quickBtns = quickBtns.filter(btn => btn.category !== id);
        saveCategories();
        saveQuickBtns();
        renderSettingsLists();
        renderQuickAddGrid();
    }
};

// Add Quick Add Button
document.getElementById('add-quick-btn-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const label = document.getElementById('new-q-label').value.trim();
    const amount = document.getElementById('new-q-amount').value.trim();
    const type = document.getElementById('new-q-type').value;
    const category = document.getElementById('new-q-category').value;
    const icon = document.getElementById('new-q-icon').value.trim();
    const id = 'q_' + Date.now();

    if (!label || !icon) return;

    quickBtns.push({ id, label, type, category, amount, icon });
    saveQuickBtns();
    document.getElementById('add-quick-btn-form').reset();
    renderSettingsLists();
    renderQuickAddGrid();
});

// Delete Quick Add Button
window.deleteQuickBtn = function(id) {
    if (confirm('คุณต้องการลบปุ่มบันทึกด่วนนี้ใช่หรือไม่?')) {
        quickBtns = quickBtns.filter(btn => btn.id !== id);
        saveQuickBtns();
        renderSettingsLists();
        renderQuickAddGrid();
    }
};

// --- DISPLAY RENDERERS ---

// Calculate Summary Info
function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount;
        } else {
            totalExpense += tx.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    balanceAmountEl.innerText = `฿${balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    incomeTotalEl.innerText = `฿${totalIncome.toLocaleString('th-TH')}`;
    expenseTotalEl.innerText = `฿${totalExpense.toLocaleString('th-TH')}`;
}

// Format Thai Date
function formatThaiDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Render Today's Details Tab
function render() {
    updateSummary();
    renderQuickAddGrid();

    // Get today's local date string (YYYY-MM-DD)
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);

    // Filter transactions for today
    const todayTransactions = transactions.filter(tx => tx.date === todayStr);

    if (todayTransactions.length === 0) {
        transactionListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">☕</div>
                <p>ยังไม่มีรายการบันทึกของวันนี้</p>
                <p style="font-size: 12px; opacity: 0.7;">กดปุ่มบันทึกด่วนหรือปุ่ม + ด้านล่างเพื่อเริ่ม</p>
            </div>
        `;
        return;
    }

    transactionListEl.innerHTML = todayTransactions.map(tx => {
        const sign = tx.type === 'income' ? '+' : '-';
        const typeClass = tx.type === 'income' ? 'income' : 'expense';
        const categoryObj = categories.find(c => c.id === tx.category);
        const icon = categoryObj ? categoryObj.icon : '📦';
        
        return `
            <div class="transaction-card">
                <div class="tx-info">
                    <div class="tx-icon-box" style="background: ${tx.type === 'income' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)'}">
                        ${icon}
                    </div>
                    <div class="tx-details">
                        <span class="tx-title">${tx.description}</span>
                        <span class="tx-time">${tx.time} น.</span>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount ${typeClass}">${sign}฿${tx.amount.toLocaleString()}</span>
                    <button class="delete-tx-btn" onclick="deleteTransaction('${tx.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Render Daily Summary Tab
function renderDailySummary() {
    const dailyData = {};

    transactions.forEach(tx => {
        const dateStr = tx.date; // YYYY-MM-DD
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                income: 0,
                expense: 0
            };
        }

        if (tx.type === 'income') {
            dailyData[dateStr].income += tx.amount;
        } else {
            dailyData[dateStr].expense += tx.amount;
        }
    });

    const sortedDates = Object.keys(dailyData).sort().reverse();

    if (sortedDates.length === 0) {
        dailySummaryListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <p>ยังไม่มีข้อมูลสรุปรายวัน</p>
            </div>
        `;
        return;
    }

    dailySummaryListEl.innerHTML = sortedDates.map(dateStr => {
        const data = dailyData[dateStr];
        const profit = data.income - data.expense;
        const profitClass = profit >= 0 ? 'plus' : 'minus';
        const profitSign = profit >= 0 ? '+' : '';

        return `
            <div class="monthly-item">
                <div class="monthly-header">
                    <span>${formatThaiDate(dateStr)}</span>
                </div>
                <div class="monthly-details-grid">
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">รายรับ</span>
                        <span class="monthly-sub-val" style="color: var(--income-color)">฿${data.income.toLocaleString()}</span>
                    </div>
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">รายจ่าย</span>
                        <span class="monthly-sub-val" style="color: var(--expense-color)">฿${data.expense.toLocaleString()}</span>
                    </div>
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">กำไรสุทธิ</span>
                        <span class="monthly-sub-val ${profitClass}">${profitSign}฿${profit.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Monthly Summary Tab
function renderMonthlySummary() {
    const monthlyData = {};

    transactions.forEach(tx => {
        const dateObj = new Date(tx.date);
        const yearMonth = tx.date.substring(0, 7); // "YYYY-MM"
        
        if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = {
                income: 0,
                expense: 0,
                label: dateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
            };
        }

        if (tx.type === 'income') {
            monthlyData[yearMonth].income += tx.amount;
        } else {
            monthlyData[yearMonth].expense += tx.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort().reverse();

    if (sortedMonths.length === 0) {
        monthlyListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>ยังไม่มีข้อมูลสรุปรายเดือน</p>
            </div>
        `;
        return;
    }

    monthlyListEl.innerHTML = sortedMonths.map(ym => {
        const data = monthlyData[ym];
        const profit = data.income - data.expense;
        const profitClass = profit >= 0 ? 'plus' : 'minus';
        const profitSign = profit >= 0 ? '+' : '';

        return `
            <div class="monthly-item">
                <div class="monthly-header">
                    <span>${data.label}</span>
                </div>
                <div class="monthly-details-grid">
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">รายรับรวม</span>
                        <span class="monthly-sub-val" style="color: var(--income-color)">฿${data.income.toLocaleString()}</span>
                    </div>
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">รายจ่ายรวม</span>
                        <span class="monthly-sub-val" style="color: var(--expense-color)">฿${data.expense.toLocaleString()}</span>
                    </div>
                    <div class="monthly-sub-item">
                        <span class="monthly-sub-label">กำไรสุทธิ</span>
                        <span class="monthly-sub-val ${profitClass}">${profitSign}฿${profit.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- BACKUP & RESTORE FUNCTIONS ---

window.exportBackup = function() {
    const backupData = {
        transactions: transactions,
        categories: categories,
        quickBtns: quickBtns,
        version: "1.0",
        exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    
    // Format YYYY-MM-DD
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `บัญชีธุรกิจ_สำรองข้อมูล_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};

window.triggerImport = function() {
    document.getElementById('import-file-input').click();
};

window.importBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Basic validation
            if (!imported.transactions || !Array.isArray(imported.transactions)) {
                throw new Error("ข้อมูลรายการธุรกรรมไม่ถูกต้อง");
            }

            if (confirm(`พบข้อมูลรายการธุรกรรมจำนวน ${imported.transactions.length} รายการ ต้องการนำเข้าข้อมูลนี้และเขียนทับข้อมูลปัจจุบันหรือไม่?`)) {
                // Set data
                transactions = imported.transactions;
                if (imported.categories && Array.isArray(imported.categories)) {
                    categories = imported.categories;
                }
                if (imported.quickBtns && Array.isArray(imported.quickBtns)) {
                    quickBtns = imported.quickBtns;
                }

                // Save to LocalStorage
                saveTransactions();
                saveCategories();
                saveQuickBtns();

                alert("นำเข้าข้อมูลสำเร็จแล้ว! ระบบจะรีเฟรชหน้าเว็บ");
                window.location.reload();
            }
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการนำเข้าข้อมูล: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.generateAndDownloadIcon = function() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Draw rounded background gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#6a9c75'); // Matcha Green Light
    gradient.addColorStop(1, '#4e7c59'); // Matcha Green Dark
    ctx.fillStyle = gradient;
    
    // Draw rounded rect helper
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }
    
    // Fill background
    roundRect(0, 0, 512, 512, 110);

    // 2. Draw soft central inner glow circle
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // 3. Draw emoji shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;

    // 4. Draw Emoji Icon
    ctx.font = '240px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍹', 256, 266);

    // Trigger download
    const link = document.createElement('a');
    link.download = 'icon.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
};

// Initial Run
render();
