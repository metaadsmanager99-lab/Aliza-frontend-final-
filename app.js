// ⚠️ TUMHARA ASLI RENDER BACKEND URL (FIXED)
const RENDER_BACKEND_URL = "https://aliza-trading-final-codes.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- TELEGRAM INIT ---
    let tg;
    try {
        tg = window.Telegram.WebApp;
        tg.expand();
        tg.ready();
    } catch(e) { console.log("Running outside Telegram"); }
    
    const USER_ID = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 100000);

    // --- SEAMLESS TICKER LOGIC ---
    const tickerContainer = document.getElementById('tickerItems');
    if (tickerContainer) {
        const names = ["Rahul", "Priya", "Amit", "Sara", "Ali", "Neha", "Usman", "Ravi", "Ayesha", "John", "Karan", "Sana"];
        let baseHTML = "";
        for(let i=0; i<12; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const profit = Math.floor(Math.random() * (300 - 50 + 1)) + 50;
            baseHTML += `<div class="ticker-item">🏆 ${name} Profit: <span>+$${profit}</span></div>`;
        }
        tickerContainer.innerHTML = baseHTML + baseHTML; 
    }

    // --- DROPDOWN LOGIC ---
    const marketSelect = document.getElementById('marketType');
    const assetSelect = document.getElementById('assetPair');
    const assetsData = { 
        live: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "NZD/USD"], 
        otc: ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "BTC/USD (OTC)"] 
    };

    if (marketSelect && assetSelect) {
        marketSelect.addEventListener('change', () => {
            assetSelect.innerHTML = '<option value="" disabled selected>-- Select Asset Pair --</option>';
            const selectedMarket = marketSelect.value;
            if (assetsData[selectedMarket]) {
                assetsData[selectedMarket].forEach(pair => {
                    let opt = document.createElement('option');
                    opt.value = pair; opt.innerHTML = pair;
                    assetSelect.appendChild(opt);
                });
            }
        });
    }

    // --- TABS SWITCHING LOGIC ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active-nav'));
            tabContents.forEach(tab => tab.classList.remove('active-tab'));

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
            
            if(!email || !password) return alert("⚠️ Credentials required!");
            
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
                alert("❌ Server Connection Failed. Check internet or contact Admin.");
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
                alert("❌ Access Denied by Admin.");
                document.getElementById('waiting-msg').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            }
        } catch (e) {}
    }

    // --- SAFELY INIT VOICE ENGINE ---
    function speakSignal(direction) {
        try {
            if ('speechSynthesis' in window && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(direction === 'UP' ? 'Buy Now. Go Up' : 'Sell Now. Go Down');
                utterance.pitch = 1.1;
                const voices = window.speechSynthesis.getVoices();
                const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira'));
                if (femaleVoice) utterance.voice = femaleVoice;
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) { console.log("Voice not supported"); }
    }

    // --- BULLETPROOF SIGNAL GENERATION LOGIC ---
    const btnGen = document.getElementById('btnGen');
    if (btnGen) {
        btnGen.addEventListener('click', async () => {
            
            // 🚨 Strict Validation
            if (!marketSelect.value) {
                alert("⚠️ Please select a Market Category first!");
                return;
            }
            if (!assetSelect.value) {
                alert("⚠️ Please select an Asset Pair first!");
                return;
            }

            const scanner = document.getElementById('scanner');
            const resultBox = document.getElementById('resultBox');
            const originalText = btnGen.innerText;
            
            // UI Update - Show scanning process
            btnGen.innerText = "SCANNING MARKET ⚡...";
            btnGen.style.opacity = "0.7";
            btnGen.disabled = true;
            resultBox.style.display = 'none';
            scanner.style.display = 'block';
            
            if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            try {
                const response = await fetch(`${RENDER_BACKEND_URL}/api/get_signal/${USER_ID}`);
                const data = await response.json();
                
                // If limit reached or unauthorized
                if (response.status !== 200) {
                    alert("❌ ERROR: " + (data.message || data.error || "Access Denied. Contact Admin."));
                    resetBtn(btnGen, originalText, scanner);
                    return;
                }

                // AI Success
                scanner.style.display = 'none';
                resultBox.style.display = 'block';
                resetBtn(btnGen, "GENERATE NEXT SIGNAL 🔄", scanner, false);
                
                const isUp = data.direction === 'UP';
                document.getElementById('signalOutput').className = 'signal-text ' + (isUp ? 'signal-UP' : 'signal-DOWN');
                document.getElementById('signalOutput').innerHTML = isUp ? 'CALL (UP) ⬆️' : 'PUT (DOWN) ⬇️';
                
                document.getElementById('accuracyText').innerHTML = `AI Confidence: ${data.accuracy}%`;
                setTimeout(() => {
                    document.getElementById('accBar').style.width = `${data.accuracy}%`;
                }, 100);
                
                if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isUp ? 'success' : 'warning');
                speakSignal(data.direction);

            } catch (error) {
                // Network or Render Sleep Error
                alert("⚠️ NETWORK ERROR: The Render AI Server is sleeping. Please wait 30 seconds and try again.");
                resetBtn(btnGen, originalText, scanner);
            }
        });
    }

    // Helper function to reset button state
    function resetBtn(btn, text, scanner, hideScanner = true) {
        btn.innerText = text;
        btn.style.opacity = "1";
        btn.disabled = false;
        if(hideScanner) scanner.style.display = 'none';
    }

}); // End DOMContentLoaded
