import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://tyokin-3e6e8-default-rtdb.firebaseio.com/";

const firebaseConfig = {
    apiKey: "AIzaSyC2PtNLz2DbT6uB5Fyn6Z83PKVz4MKONME",
    authDomain: "tyokin-3e6e8.firebaseapp.com",
    projectId: "tyokin-3e6e8",
    storageBucket: "tyokin-3e6e8.firebasestorage.app",
    messagingSenderId: "866266613441",
    appId: "1:866266613441:web:61f0e667cf9b93ba467640",
    measurementId: "G-TQPST4M49G"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'kakeibo_data');

let balance = 0;
let history = [];
let currentInput = "0";
let mode = "payment";
let myChart = null;

// クラウドからデータをリアルタイム取得
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        balance = data.balance || 0;
        history = data.history || [];
        updateUI();
        renderChart();
        renderHistory();
    }
});

// 各関数をwindowオブジェクトに紐付けてHTMLから呼べるようにする
window.openInput = (m) => {
    mode = m;
    document.getElementById('screenTitle').innerText = (mode === 'income') ? "金額入力" : "支払い";
    document.getElementById('displayAmount').style.color = (mode === 'income') ? "#00cc66" : "#ff5555";
    document.getElementById('methodSelectGroup').style.display = (mode === 'income') ? "none" : "block";
    document.getElementById('execBtn').style.backgroundColor = (mode === 'income') ? "#00cc66" : "#ff5555";
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('inputScreen').style.display = 'block';
};

window.closeInput = () => {
    currentInput = "0";
    document.getElementById('displayAmount').innerText = "¥0";
    document.getElementById('inputScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
};

window.addNumber = (n) => {
    if (currentInput === "0") currentInput = n.toString();
    else currentInput += n.toString();
    document.getElementById('displayAmount').innerText = `¥${Number(currentInput).toLocaleString()}`;
};

window.clearAmount = () => {
    currentInput = "0";
    document.getElementById('displayAmount').innerText = "¥0";
};

window.confirmProcess = () => {
    const amount = Number(currentInput);
    if (amount <= 0) return;

    if (mode === 'income') balance += amount;
    else balance -= amount;

    const now = new Date();
    history.push({
        id: Date.now(),
        date: `${now.getMonth()+1}/${now.getDate()}`,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
        type: mode,
        amount: amount,
        currentBalance: balance,
        method: (mode === 'payment') ? document.getElementById('cardSelect').value : "収入"
    });

    // クラウド（Firebase）へ保存
    set(dbRef, { balance, history });
    window.closeInput();
};

window.deleteRecord = (id) => {
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
        // クラウド（Firebase）へ保存
        set(dbRef, { balance, history });
    }
};

function updateUI() {
    document.getElementById('balance').innerText = `¥${balance.toLocaleString()}`;
}

function renderChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    const recentData = history.slice(-10);
    const labels = recentData.map(h => h.date);
    const data = recentData.map(h => h.currentBalance / 10000);

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: '残高推移 (万円)', data: data, backgroundColor: '#00aaff', borderRadius: 6 }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: false } } }
    });
}

function renderHistory() {
    const body = document.getElementById('historyBody');
    body.innerHTML = history.slice().reverse().map(h => `
        <tr>
            <td style="color:#888; font-size:11px;">${h.date}<br>${h.time}</td>
            <td class="${h.type === 'income' ? 'amount-plus' : 'amount-minus'}">
                ${h.type === 'income' ? '+' : '-'}¥${h.amount.toLocaleString()}
            </td>
            <td><button class="undo-btn" onclick="window.deleteRecord(${h.id})">取消</button></td>
        </tr>
    `).join('');
}