// ⚠️ APNA RENDER URL YAHAN DAALNA
const RENDER_BACKEND_URL = "https://metaadsmanager99-lab.onrender.com"; // Tumhara backend URL

let tg;
try {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
} catch(e) { console.log("Web Mode"); }

// Generate Unique User ID
const USER_ID = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 100000);

// ==========================================
// 🚀 TAB SWITCHING LOGIC
// ==========================================
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Remove active class from nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    // Show selected
    document.getElementById(`tab-${tabId}`).classList.add('active');
    // Highlight nav
    event.currentTarget.classList.add('active');
    
    if(tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ==========================================
// 💸 ZERO-DELAY TICKER LOGIC (Seamless)
// ==========================================
try {
    const names = ["Rahul", "Priya", "Amit", "Sara", "Ali", "Neha", "Usman", "Ravi", "Ayesha", "John"];
    const tickerContainer = document.getElementById('tickerItems');
    if (tickerContainer) {
        let baseHTML = "";
        for(let i=0; i<10; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const profit = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
            baseHTML += `<div class="ticker-item">🏆 ${name} made <span>$${profit}</span> profit</div>`;
        }
        // Duplicate content strictly for seamless CSS marquee scroll
        tickerContainer.innerHTML = baseHTML + baseHTML; 
    }
} catch(e) {}

// ==========================================
// 🔐 LOGIN & APPROVAL LOGIC (Strict Lock)
// ==========================================
let pollInterval;
const btnLogin = document.getElementById('btnLogin');

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if(!email || !password) return alert("Enter email and password!");

        document.getElementById('login-form').style.display = 'none';
        document.getElementById('waiting-msg').style.display = 'block';

        try {
            // Because backend code resets status to pending every time they hit this endpoint, 
            // if a user refreshes the app, they HAVE to request access again!
            await fetch(`${RENDER_BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: USER_ID, email, password })
            });
            pollInterval = setInterval(checkApproval, 3000);
        } catch (e) {
            alert("Server connection error.");
        }
    });
}

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
    const bottomNav = document.getElementById('bottom-nav');
    
    splash.style.display = 'flex';
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            mainApp.style.display = 'block';
            bottomNav.style.display = 'flex'; // Show tabs
            document.body.style.overflow = 'auto';
        }, 800);
    }, 2500);
}

// ==========================================
// 🚀 POPULATE DROPDOWNS SAFELY
// ==========================================
try {
    const marketSelect = document.getElementById('marketType');
    const assetSelect = document.getElementById('assetPair');
    const assets = { 
        live: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"], 
        otc: ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)"] 
    };

    if (marketSelect && assetSelect) {
        function populateAssets() {
            assetSelect.innerHTML = '';
            const selectedMarket = marketSelect.value || 'live';
            assets[selectedMarket].forEach(pair => {
                let opt = document.createElement('option');
                opt.value = pair; opt.innerHTML = pair;
                assetSelect.appendChild(opt);
            });
        }
        marketSelect.innerHTML = '';
        ['live', 'otc'].forEach(type => {
            let opt = document.createElement('option');
            opt.value = type; opt.innerHTML = type === 'live' ? "Live Market" : "OTC Market";
            marketSelect.appendChild(opt);
        });
        marketSelect.addEventListener('change', populateAssets);
        populateAssets();
    }
} catch (error) {}

// ==========================================
// 🎙️ VOICE & SIGNAL LOGIC
// ==========================================
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

const btnGen = document.getElementById('btnGen');
if (btnGen) {
    btnGen.addEventListener('click', async () => {
        const scanner = document.getElementById('scanner');
        const resultBox = document.getElementById('resultBox');
        
        btnGen.style.display = 'none';
        resultBox.style.display = 'none';
        scanner.style.display = 'block';
        if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        try {
            const response = await fetch(`${RENDER_BACKEND_URL}/api/get_signal/${USER_ID}`);
            
            // 🚨 IF LIMIT REACHED
            if(response.status === 403) {
                const errorData = await response.json();
                scanner.style.display = 'none';
                btnGen.style.display = 'block';
                if(tg?.showAlert) tg.showAlert(errorData.message || "Limit Reached!");
                else alert(errorData.message || "Limit Reached!");
                return;
            }

            const data = await response.json();
            scanner.style.display = 'none';
            resultBox.style.display = 'block';
            btnGen.style.display = 'block';
            btnGen.innerText = "Get Next Signal 🔄";
            
            const isUp = data.direction === 'UP';
            document.getElementById('signalOutput').className = 'signal-text ' + (isUp ? 'signal-UP' : 'signal-DOWN');
            document.getElementById('signalOutput').innerHTML = data.message;
            document.getElementById('accuracyText').innerHTML = `AI Confidence: ${data.accuracy}%`;
            
            if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isUp ? 'success' : 'warning');
            speakSignal(data.direction);

        } catch (error) {
            scanner.style.display = 'none';
            btnGen.style.display = 'block';
            if(tg?.showAlert) tg.showAlert("Server Offline! Tell Admin to wake it up.");
            else alert("Server Offline!");
        }
    });
}
