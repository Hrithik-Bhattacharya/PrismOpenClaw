# 🔐 Environment Variables Setup Guide

**Last Updated:** May 7, 2026  
**Modules Integrated:** M1 (pi-engine) ↔ M3 (context-engine) ↔ M4 (channels-ux)

---

## ✅ Current Status

All three modules should share one **unified authentication token** for inter-module communication.

```env
M3_API_TOKEN=<same-value-in-m1-m3-m4>
```

---

## 📋 Module Locations & Current Setup

### **M1 (PI Engine) - Node.js**
📁 **Location:** `pi-engine/.env`

**Template (safe example):**
```env
LLM_PROVIDER=auto
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
M3_API_TOKEN=your_shared_api_token_here
M3_API_URL=http://localhost:5001
PORT=5000
```

**⚠️ Note:** Never commit real keys/tokens to git.

---

### **M3 (Context Engine) - Python**
📁 **Location:** `m3-context-engine/.env`

**Template (safe example):**
```env
M1_API_URL=http://localhost:5000
M1_API_TOKEN=your_shared_api_token_here
SIMULATION_MODE=true
LOG_LEVEL=INFO
DEMO_MODE=true
```

**Status:** Ready to run. Uses simulation mode (no real sensors needed).

---

### **M4 (Channels UX) - Python**
📁 **Location:** `m4-channels-ux/.env`

**Template (safe example):**
```env
M3_API_TOKEN=your_shared_api_token_here
M1_CALLBACK_URL=http://localhost:5000/override
HOST=0.0.0.0
PORT=8000
```

**❌ Needs Configuration (Telegram):**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

---

## 🛠️ What You Need To Do

### **Step 1: Get Telegram Credentials (for M4 only)**

#### Get `TELEGRAM_BOT_TOKEN`:
1. Open Telegram → Search for `@BotFather`
2. Send `/newbot`
3. Follow prompts (give a name, username)
4. BotFather replies with a token like: `1234567890:ABCDEFghijklmnop-qrstu_vwxyz...`
5. Copy this token into `m4-channels-ux/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCDEFghijklmnop-qrstu_vwxyz...
   ```

#### Get `TELEGRAM_CHAT_ID`:
1. Privately message your bot (use the username from step 2 above)
2. Send it any message (e.g., "hello")
3. Open this URL in browser (replace `<TOKEN>` with your token):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Look for the `"chat":{"id":...}` field. That number is your Chat ID.
5. Copy into `m4-channels-ux/.env`:
   ```env
   TELEGRAM_CHAT_ID=123456789
   ```

**Example after setup:**
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFghijklmnop-qrstu_vwxyz1234567
TELEGRAM_CHAT_ID=987654321
M3_API_TOKEN=phantom-shared-secret-2024
M1_CALLBACK_URL=http://localhost:5000/override
HOST=0.0.0.0
PORT=8000
```

---

### **Step 2: Verify All Three .env Files**

Run this PowerShell command from `C:\Coding\PrismOpenClaw` to verify:

```powershell
# M1
Get-Content pi-engine\.env | Select-String "M3_API_TOKEN|PORT"

# M3
Get-Content m3-context-engine\.env | Select-String "M1_API_TOKEN"

# M4
Get-Content m4-channels-ux\.env | Select-String "M3_API_TOKEN|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID"
```

Expected output:
```
M3_API_TOKEN=<same value in all three>      (M1/M3/M4)
PORT=5000                                     (M1)
M1_API_TOKEN=<same shared token>            (M3)
TELEGRAM_BOT_TOKEN=<your_token>             (M4)
TELEGRAM_CHAT_ID=<your_id>                  (M4)
```

---

## 🚀 Running the Modules

### **Terminal 1: Start M1 (PI Engine)**
```powershell
cd C:\Coding\PrismOpenClaw\pi-engine
npm install      # First time only
node index.js start
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════════════╗
║                   🧠 PI ENGINE v2.0.0                            ║
║             Persona Intelligence — Full Build v2                 ║
╚══════════════════════════════════════════════════════════════════╝

✅ Heartbeat started...
```

**Verify M1 is running:**
```powershell
Invoke-RestMethod http://localhost:5000/health
```

---

### **Terminal 2: Start M3 (Context Engine)**
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
.\venv_m3\Scripts\Activate.ps1             # Activate venv (first time: python -m venv venv_m3)
python src/main.py
```

**Expected output:**
```
============================================================
🧠 M3 CONTEXT ENGINE - PrismOpenClaw Phantom Mode
============================================================
```

**Check that M3 is sending context to M1:**
- Look for logs mentioning `/context` or M1 API calls
- M1's terminal should show: `📡 Context received from M3`

---

### **Terminal 3: Start M4 (Channels UX)**
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
.\venv_m4\Scripts\Activate.ps1             # Activate venv (first time: python -m venv venv_m4)
python main.py
```

**Expected output:**
```
✅ M4 Channels UX server started on 0.0.0.0:8000
```

**Verify M4 is running:**
```powershell
Invoke-RestMethod http://localhost:8000/health
```

---

## 🧪 Testing Integration

### **Test 1: M1 is running**
```powershell
Invoke-RestMethod http://localhost:5000/health
# Should return: {"status":"ok","version":"2.0.0"}
```

### **Test 2: M3 is running**
```powershell
# M3 doesn't expose HTTP endpoints, check process:
Get-Process python | Where-Object {$_.ProcessName -like "*python*"}
```

### **Test 3: M4 is running**
```powershell
Invoke-RestMethod http://localhost:8000/health
# Should return: {"status":"ok"}
```

### **Test 4: M1 ↔ M3 Communication**
- M3 should automatically start sending context to M1 every 60 seconds
- Check **M1's terminal** for logs like: `📡 Received context from M3`
- Check **M3's terminal** for logs like: `✅ Context sent to M1`

### **Test 5: M4 Can Receive Notifications**
- Trigger a conflict in M1 (check demo output)
- M4 should POST to your Telegram bot
- **Check your Telegram chat** for a message from the bot

---

## 🔗 Port Configuration

| Module | Port | URL | Purpose |
|--------|------|-----|---------|
| **M1** | 5000 | `http://localhost:5000` | PI Engine decision-making |
| **M3** | (none) | `http://localhost:5001` (internal) | Context sensor engine |
| **M4** | 8000 | `http://localhost:8000` | Telegram webhook + notifications |

⚠️ **If ports conflict:**
- Check what's using the port:
  ```powershell
  netstat -ano | findstr :5000
  netstat -ano | findstr :8000
  ```
- Kill process: `Stop-Process -Id <PID> -Force`
- Or change port in `.env` and restart

---

## 🆘 Troubleshooting

### **M1 fails to start**
```
Error: GROQ_API_KEY not set
```
→ Check `.env` file exists in `pi-engine/` and `GROQ_API_KEY` is populated

### **M3 fails to start**
```
Error: M1_API_TOKEN not set
```
→ Check `m3-context-engine/.env` has `M1_API_TOKEN=phantom-shared-secret-2024`

### **M4 fails to start**
```
KeyError: 'TELEGRAM_BOT_TOKEN'
```
→ Complete the Telegram setup (Step 1 above) and fill in all required fields

### **M4/Telegram unavailable but M1+M3 should still run**
→ Keep M1 and M3 running; core context → decision loop continues.
→ In `pi-engine/.env`, keep fallback-friendly settings:
  - `ENABLE_M4_PUSH=true` (M1 attempts push but should continue even if M4 is down)
  - `USE_M4_SIM=true` (demo-safe behavior)
→ M1↔M3 integration remains the primary path and is independent of Telegram delivery.

### **Modules can't communicate**
```
requests.exceptions.ConnectionError: Connection refused
```
→ Check all three modules are running in separate terminals
→ Verify `.env` files have correct IP/ports (localhost should work on same machine)
→ Run: `netstat -ano | findstr :5000` and `netstat -ano | findstr :8000` to verify ports are listening

### **Telegram not receiving messages**
→ Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `m4-channels-ux/.env`
→ Check M4 logs for POST failures
→ Verify bot is receiving messages: `https://api.telegram.org/bot<TOKEN>/getUpdates`

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  M1 (PI ENGINE - Port 5000)                                 │
│  Node.js | Decision Making | Persona Management             │
│  ├─ LLM Engine (Groq/Gemini)                                │
│  ├─ Confidence Engine                                       │
│  └─ Conflict Resolution                                     │
└──────────┬───────────────────────────────────────┬──────────┘
           │                                       │
           │ (x-api-token: phantom-shared-secret)  │
           │                                       │
    ┌──────▼──────┐                         ┌──────▼──────┐
    │ M3 (Context │                         │ M4 (Channels
    │ Port 5001)  │                         │ Port 8000)
    │ Python      │                         │ Python
    │ ├─ GPS      │                         │ ├─Telegram
    │ ├─ WiFi     │                         │ ├─Twilio
    │ ├─ Calendar │                         │ └─WhatsApp
    │ └─ Battery  │                         └─────────────┘
    └─────────────┘                              ▲
         │                                       │
         │ (POST /stress-alert)                  │
         └───────────────────────────────────────┘
              (user decision via Telegram)
```

---

## ✨ Quick Start Commands (All 3 in One View)

```powershell
# Terminal 1: M1
cd C:\Coding\PrismOpenClaw\pi-engine
npm install
node index.js start

# Terminal 2: M3
cd C:\Coding\PrismOpenClaw\m3-context-engine
pip install -r requirements.txt
python src/main.py

# Terminal 3: M4
cd C:\Coding\PrismOpenClaw\m4-channels-ux
pip install -r requirements.txt
python main.py
```

Once all three are running, they'll automatically start communicating via the shared `M3_API_TOKEN`.

---

## 📝 Notes

- **Shared Token:** Use the same token value in M1/M3/M4
- **Simulation Mode:** M3 runs in `SIMULATION_MODE=true` with realistic mock data (no Android device needed)
- **LLM Fallback:** M1 tries Groq first, then falls back to Gemini
- **Demo Mode:** M3 uses `DEMO_MODE=true` to generate realistic daily patterns
- **No Database:** All data is in-memory + file-based logs (see `memory/` and `state.json`)
