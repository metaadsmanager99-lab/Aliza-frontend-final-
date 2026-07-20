// ⚠️ ENTER YOUR RENDER URL HERE
const RENDER_BACKEND_URL = "https://aliza-trading-final-codes.onrender.com";

const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Get unique user ID from Telegram (Fallback for browser testing)
const USER_ID = tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 100000);

// --- TICKER LOGIC (Fake Live Profits) ---
const names = ["Rahul", "Priya", "Amit", "Sara", "Ali", "Neha", "Usman", "Ravi", "Ayesha", "John"];
const tickerContainer = document.getElementById('tickerItems');
let tickerHTML = "";
for(let i=0; i<15; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const profit = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    tickerHTML += `<div class="ticker-item">🏆 ${name} made <span>$${profit}</span> profit Day 1</div>`;
}
tickerContainer.innerHTML = tickerHTML;

// --- LOGIN & APPROVAL LOGIC ---
let pollInterval;

document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(!email || !password) return alert("Enter email and password!");

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('waiting-msg').style.display = 'block';

    try {
        await fetch(`${RENDER_BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: USER_ID, email, password })
        });

        // Start polling for admin approval every 3 seconds
        pollInterval = setInterval(checkApproval, 3000);
    } catch (e) {
        alert("Server connection error.");
    }
});

async function checkApproval() {
    try {
        const res = await fetch(`${RENDER_BACKEND_URL}/api/check_status/${USER_ID}`);
        const data = await res.json();
        
        if (data.status === 'approved') {
            clearInterval(pollInterval);
            transitionToMainApp();
        } else if (data.status === 'declined') {
            clearInterval(pollInterval);
            alert("❌ Access Declined by Admin.");
            document.getElementById('waiting-msg').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }
    } catch (e) {}
}

function transitionToMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    const splash = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');
    
    splash.style.display = 'flex';
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            mainApp.style.display = 'block';
            document.body.style.overflow = 'auto';
        }, 800);
    }, 2500);
}

// --- VOICE & SIGNAL LOGIC ---
function speakSignal(direction) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(direction === 'UP' ? 'Go Up' : 'Go Down');
        utterance.pitch = 1.3;
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira'));
        if (femaleVoice) utterance.voice = femaleVoice;
        window.speechSynthesis.speak(utterance);
    }
}
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// Populate Selectors
const marketSelect = document.getElementById('marketType');
const assetSelect = document.getElementById('assetPair');
const assets = { live: ["EUR/USD", "GBP/USD", "USD/JPY"], otc: ["EUR/USD (OTC)", "GBP/USD (OTC)"] };

function populateAssets() {
    assetSelect.innerHTML = '';
    assets[marketSelect.value || 'live'].forEach(pair => {
        let opt = document.createElement('option');
        opt.value = pair; opt.innerHTML = pair;
        assetSelect.appendChild(opt);
    });
}
['live', 'otc'].forEach(type => {
    let opt = document.createElement('option');
    opt.value = type; opt.innerHTML = type === 'live' ? "Live Market" : "OTC Market";
    marketSelect.appendChild(opt);
});
marketSelect.addEventListener('change', populateAssets);
populateAssets();

// Get Signal (with Limit checking)
document.getElementById('btnGen').addEventListener('click', async () => {
    const btn = document.getElementById('btnGen');
    const scanner = document.getElementById('scanner');
    const resultBox = document.getElementById('resultBox');
    
    btn.style.display = 'none';
    resultBox.style.display = 'none';
    scanner.style.display = 'block';
    tg.HapticFeedback.impactOccurred('medium');

    try {
        const response = await fetch(`${RENDER_BACKEND_URL}/api/get_signal/${USER_ID}`);
        
        // 🚨 IF LIMIT REACHED
        if(response.status === 403) {
            const errorData = await response.json();
            scanner.style.display = 'none';
            btn.style.display = 'block';
            
            // Show Native Telegram Alert
            tg.showAlert(errorData.message || "Limit Reached! Talk to admin for continuation.");
            return;
        }

        const data = await response.json();
        scanner.style.display = 'none';
        resultBox.style.display = 'block';
        btn.style.display = 'block';
        btn.innerText = "Get Next Signal 🔄";
        
        const isUp = data.direction === 'UP';
        document.getElementById('signalOutput').className = 'signal-text ' + (isUp ? 'signal-UP' : 'signal-DOWN');
        document.getElementById('signalOutput').innerHTML = data.message;
        document.getElementById('accuracyText').innerHTML = `AI Confidence: ${data.accuracy}%`;
        
        tg.HapticFeedback.notificationOccurred(isUp ? 'success' : 'warning');
        speakSignal(data.direction);

    } catch (error) {
        scanner.style.display = 'none';
        btn.style.display = 'block';
        tg.showAlert("Server Error. Try again.");
    }
});
