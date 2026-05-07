# ✅ PrismOpenClaw M1-M3-M4 Environment Setup Complete

**Date:** May 7, 2026  
**Status:** M1 ✅ M3 ✅ | M4 ⚠️ (Python 3.13 compatibility issue - see workaround)

---

## 📋 What's Been Done

### ✅ **M1 (PI Engine - Node.js)**
- **Status:** READY
- **Location:** `pi-engine/`
- **Setup:** Global npm dependencies
- **Env File:** `.env` (configured)
- **Config Loaded:**
  ```
  GROQ_API_KEY=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
  GEMINI_API_KEY=AIzaSyD8puVOwXdwaHGmEFoTAR5-X4V46Q5BlsU
  M3_API_TOKEN=phantom-shared-secret-2024
  M3_API_URL=http://localhost:5001
  PORT=5000
  ```
- **Verified:** ✅ Startup confirmed - heartbeat running

### ✅ **M3 (Context Engine - Python)**
- **Status:** READY
- **Location:** `m3-context-engine/`
- **Setup:** Virtual environment `venv_m3` (created & configured)
- **Env File:** `.env` (configured)
- **Config Loaded:**
  ```
  M1_API_URL=http://localhost:5000
  M1_API_TOKEN=phantom-shared-secret-2024
  SIMULATION_MODE=true
  DEMO_MODE=true
  ```
- **Verified:** ✅ Startup confirmed - sending context to M1

### ⚠️ **M4 (Channels UX - Python)**
- **Status:** NEEDS WORKAROUND
- **Location:** `m4-channels-ux/`
- **Setup:** Virtual environment `venv_m4` (created, dependency conflict)
- **Issue:** Python 3.13 + FastAPI/Pydantic version mismatch
- **Workaround:** See below

---

## 🚀 How to Run (M1 & M3 Working)

### **Terminal 1: Start M1**
```powershell
cd C:\Coding\PrismOpenClaw\pi-engine
npm install          # Already done, skip if not needed
node index.js start
```
**Expected output:**
```
╔══════════════════════════════════════════╗
║          🧠 PI ENGINE v2.0.0              ║
╚══════════════════════════════════════════╝
✅ Heartbeat running in background
```

### **Terminal 2: Start M3**
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
.\venv_m3\Scripts\Activate.ps1
python src/main.py
```
**Expected output:**
```
============================================================
🧠 M3 CONTEXT ENGINE - PrismOpenClaw Phantom Mode
============================================================
🔄 Cycle #1 - 2026-05-07 20:20:44
📊 Building context...
📡 Sending to M1...
```

### **Terminal 3: Start M4 (Workaround)**

**Option A: Use Poetry (Recommended)**
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
pip install poetry
poetry install
poetry run python main.py
```

**Option B: Use Python 3.11 or 3.12 with venv_m4**
```powershell
# If you have Python 3.11/3.12 installed:
py -3.11 -m venv venv_m4_py311
venv_m4_py311\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

**Option C: Skip M4 for now, test M1↔M3**
```powershell
# All three terminals running M1 and M3 proves integration works
# M4 can be added later when Python version issue is resolved
```

---

## 🔧 Troubleshooting M4

### **If you see: `TypeError: ForwardRef._evaluate() missing 1 required keyword-only argument`**

This is a Python 3.13 compatibility issue with Pydantic/FastAPI compilation.

**Solutions:**
1. ✅ **Recommended:** Use Python 3.11 or 3.12 (see Option B above)
2. Install Visual Studio C++ build tools for Python 3.13 (complex)
3. Use WSL2 or Docker to run M4 with Python 3.11

---

## 📊 Integration Flow (Working)

```
M3 (Context Engine)
    ↓
    └──────→ POST /context ──────→ M1 (PI Engine)
              (x-api-token: phantom-shared-secret-2024)
    ↑
    └──────← Receives personas/decisions ←──────


M1 (PI Engine) 
    ├─→ Processes context
    ├─→ Makes decisions  
    └─→ [Ready to push to M4] ← (waiting for M4 dependency fix)
```

---

## ✅ Verification Checklist

- [x] All `.env` files created with shared token
- [x] M1 (pi-engine) - startup verified
- [x] M3 (context-engine) - startup & M1 communication verified
- [x] M3 venv installed successfully
- [x] M4 venv created (dependency conflict identified)
- [x] Documentation complete

---

## 📝 Quick Reference Commands

| Module | Start Command | Port | Status |
|--------|---|---|---|
| **M1** | `cd pi-engine && node index.js start` | 5000 | ✅ Ready |
| **M3** | `cd m3-context-engine && .\venv_m3\Scripts\Activate.ps1 && python src/main.py` | (internal) | ✅ Ready |
| **M4** | `cd m4-channels-ux && .\venv_m4\Scripts\Activate.ps1 && python main.py` | 8000 | ⚠️ Needs fix |

---

## 🎯 Next Steps

1. **Run M1 & M3 together** to verify the M1↔M3 integration
2. **Choose an option for M4**:
   - Option A: Install Poetry and use Python 3.11/3.12
   - Option B: Switch to Python 3.11 or 3.12 system-wide
   - Option C: Wait for dependency updates
3. **Test full integration** once M4 is running
4. **Get Telegram credentials** (needed for M4):
   - `TELEGRAM_BOT_TOKEN` (from @BotFather)
   - `TELEGRAM_CHAT_ID` (from your private chat with bot)

---

## 📚 Documentation Files

- **[ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)** - Complete environment setup guide
- **[pi-engine/README.md](pi-engine/README.md)** - M1 documentation
- **[m3-context-engine/QUICKSTART.md](m3-context-engine/QUICKSTART.md)** - M3 documentation
- **[m4-channels-ux/README.md](m4-channels-ux/README.md)** - M4 documentation

---

## 🔑 Shared Configuration

All three modules use this shared authentication token:
```
M3_API_TOKEN=phantom-shared-secret-2024
```

This token is required in headers for all inter-module POST requests:
```
Header: x-api-token: phantom-shared-secret-2024
```

---

## 🎬 Ready to Test!

**M1 and M3 are fully ready to run. Start both in separate terminals and you should see M3 automatically sending context to M1 every 60 seconds.**

For M4, follow one of the workaround options above. The core M1↔M3 integration is working properly! 🎉
