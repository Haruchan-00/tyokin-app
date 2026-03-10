// 初期化
let balance = Number(localStorage.getItem('balance')) || 0;
let history = JSON.parse(localStorage.getItem('history')) || [];
let currentInput = "0";
let mode = "payment"; 
let myChart = null;

// DOMの読み込み完了を待って起動
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderChart();
    renderHistory();
});

function openInput(m) {
    mode = m;
    const inputScreen = document.getElementById('inputScreen');
    const homeScreen = document.getElementById('homeScreen');
    const screenTitle = document.getElementById('screenTitle');
    const displayAmount = document.getElementById('displayAmount');
    const methodGroup = document.getElementById('methodSelectGroup');
    const execBtn = document.getElementById('execBtn');

    if (!inputScreen || !homeScreen) return;

    screenTitle.innerText = (mode === 'income') ? "金額入力" : "支払い";
    displayAmount.style.color = (mode === 'income') ? "#00cc66" : "#ff5555";
    methodGroup.style.display = (mode === 'income') ? "none" : "block";
    execBtn.style.backgroundColor = (mode === 'income') ? "#00cc66" : "#ff5555";
    execBtn.style.boxShadow = (mode === 'income') ? "0 4px 0px #00a653" : "0 4px 0px #d44444";
    
    homeScreen.style.display = 'none';
    inputScreen.style.display = 'block';
}

function closeInput() {
    currentInput = "0";
    document.getElementById('displayAmount').innerText = "¥0";
    document.getElementById('inputScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
}

function addNumber(n) {
    if (currentInput === "0") currentInput = n.toString();
    else currentInput += n.toString();
    document.getElementById('displayAmount').innerText = `¥${Number(currentInput).toLocaleString()}`;
}

function clearAmount() {
    currentInput = "0";
    document.getElementById('displayAmount').innerText = "¥0";
}

function confirmProcess() {
    const amount = Number(currentInput);
    if (amount <= 0) return;

    if (mode === 'income') balance += amount;
    else balance -= amount;

    const now = new Date();
    const dateStr = `${now.getMonth()+1}/${now.getDate()}`;
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    history.push({
        id: Date.now(),
        date: dateStr,
        time: timeStr,
        type: mode,
        amount: amount,
        currentBalance: balance,
        method: (mode === 'payment') ? document.getElementById('cardSelect').value : "収入"
    });

    saveAndRefresh();
    closeInput();
}

function deleteRecord(id) {
    if (!confirm("この操作を取り消しますか？")) return;
    const index = history.findIndex(h => h.id === id);
    if (index !== -1) {
        const target = history[index];
        const diff = (target.type === 'income') ? -target.amount : target.amount;
        balance += diff;
        history.splice(index, 1);
        for (let i = index; i < history.length; i++) {
            history[i].currentBalance += diff;
        }
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem('balance', balance);
    localStorage.setItem('history', JSON.stringify(history));
    updateUI();
    renderChart();
    renderHistory();
}

function updateUI() {
    const balanceEl = document.getElementById('balance');
    if (balanceEl) balanceEl.innerText = `¥${balance.toLocaleString()}`;
}

function renderChart() {
    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const recentData = history.slice(-10); // 直近10件
    const labels = recentData.map(h => h.date);
    const data = recentData.map(h => h.currentBalance / 10000);

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '残高推移 (万円)',
                data: data,
                backgroundColor: '#00aaff',
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });
}

function renderHistory() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = history.slice().reverse().map(h => `
        <tr>
            <td style="color:#888; font-size:11px;">${h.date}<br>${h.time}</td>
            <td class="${h.type === 'income' ? 'amount-plus' : 'amount-minus'}">
                ${h.type === 'income' ? '+' : '-'}¥${h.amount.toLocaleString()}
            </td>
            <td><button class="undo-btn" onclick="deleteRecord(${h.id})">取消</button></td>
        </tr>
    `).join('');
}