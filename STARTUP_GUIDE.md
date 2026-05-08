# Phantom Mode Unified Startup & Integration Guide

This guide is for the **latest integrated repo** where:
- M1 and M3 are working
- M4 Telegram messaging is working
- M2 has delivered their part and must be validated via M1 action + ACK flow

It focuses on one goal: **start all modules correctly and verify conflict user input is handled end-to-end**.

---

## 1) Prerequisites

- Windows 11 + PowerShell
- Node.js + npm
- Python 3.10+
- (Optional for real M2 device test) Android SDK platform-tools (`adb`)

---

## 2) Environment Setup (IMPORTANT)

You need `.env` in these modules:

- `pi-engine/.env`
- `m3-context-engine/.env`
- `m4-channels-ux/.env`

Use the **same shared token** in all places:

```env
M3_API_TOKEN=<same-value-in-m1-m3-m4>
```

Also set:
- `m3-context-engine/.env` → `M1_API_TOKEN=<same shared token>`
- `m4-channels-ux/.env` → valid `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

---

## 3) Venv Setup (M3 + M4)

### M3 venv
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
python -m venv venv_m3
.\venv_m3\Scripts\Activate.ps1
pip install -r requirements.txt
```

### M4 venv
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
python -m venv venv_m4
.\venv_m4\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 4) Startup Order (4 terminals for full integration)

### Terminal 1 — M1 (PI Engine API)
```powershell
cd C:\Coding\PrismOpenClaw\pi-engine
npm install
node apiWrapper.js
```

Expected API routes:
- `POST /context`
- `POST /decision`
- `POST /override`
- `POST /ack`
- `GET /health`

### Terminal 2 — M3 (Context Engine)
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
.\venv_m3\Scripts\Activate.ps1
python src/main.py
```

### Terminal 3 — M4 (Channels UX)
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
.\venv_m4\Scripts\Activate.ps1
python main.py
```

### Terminal 4 — M2 (Android ADB Executor)
```powershell
cd C:\Coding\PrismOpenClaw\m2-android-adb
copy .env.example .env
node index.js --status
```

To execute latest M1 decision through M2:
```powershell
node index.js --url http://localhost:5000/decision
```

Safe test (no real ADB execution):
```powershell
node index.js --url http://localhost:5000/decision/latest --dry-run
```

---

## 5) Quick Health Checks

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:8000/health
```

Check M3 logs for successful send cycles to M1.

---

## 6) M2 Integration (Now Pulled & Active)

Current repo state now includes full M2 runtime:
- `m2-android-adb/index.js` (executor CLI)
- `m2-android-adb/actions.json` (action→ADB map)
- `m2-android-adb/INTEGRATION.md`

Integration contract:
- M1 serves decisions at `GET /decision` and `GET /decision/latest`
- M2 fetches decision via `--url`
- M2 executes `actions`
- M2 sends ACK to `POST /ack`

ACK payload example:
```json
{
  "ack": true,
  "actions_executed": ["enable_dnd", "open_calendar"],
  "errors": []
}
```

ACK target:
`http://localhost:5000/ack` (derived from `M1_API_URL` in `m2-android-adb/.env`)

---

## 7) Conflict User-Input Validation (Main Requirement)

### A) Trigger conflict message through M4 endpoint
Use same token value from `.env`:

```powershell
$token = "<same M3_API_TOKEN>"
Invoke-RestMethod -Method Post -Uri http://localhost:8000/conflict `
  -Headers @{"x-api-token"=$token} `
  -ContentType "application/json" `
  -Body '{"persona_a":"work","persona_b":"fitness"}'
```

Expected:
- Telegram receives inline buttons
- User taps one option (or Pause)

### B) Verify M4 callback reaches M1
M4 sends callback to `M1_CALLBACK_URL` (default: `http://localhost:5000/override`).

M1 accepts:
- `{ "persona": "work" }`
- or `{ "selected_persona": "work" }`
- and also maps `PAUSE` to sleep.

You should see in M1 logs:
`USER OVERRIDE REQUESTED: Switch to -> <persona>`

### C) Direct API test (without Telegram tap)
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/override `
  -ContentType "application/json" `
  -Body '{"selected_persona":"fitness"}'
```

Expected response includes:
- `success: true`
- `decision` object

---

## 8) End-to-End Checklist

- [ ] M1 API started via `node apiWrapper.js`
- [ ] M3 started in `venv_m3` and context cycles running
- [ ] M4 started in `venv_m4` and `/health` returns ok
- [ ] M2 started and can fetch decisions (`node index.js --url ...`)
- [ ] Shared token matches in M1/M3/M4
- [ ] `/conflict` call sends Telegram buttons
- [ ] User button tap posts override to M1
- [ ] M1 override log appears and decision updates
- [ ] M2 executes actions and sends `/ack`

---

## 9) Do we need `index.js`?

Yes, but **which one depends on module**:

- **M1 integration server:** use `pi-engine/apiWrapper.js` (this is required for M2/M3/M4 endpoint integration).
- **M1 `index.js`:** optional for CLI/demo/test commands (`npm start`, demo utilities), not the preferred API integration entrypoint.
- **M2 `index.js`:** required — this is the M2 executor you run for action execution + ACK flow.

---

## 10) Common Issues

- **401 on M4 endpoints**: `x-api-token` mismatch
- **No Telegram messages**: invalid `TELEGRAM_BOT_TOKEN` or wrong `TELEGRAM_CHAT_ID`
- **M1 not receiving override**: wrong `M1_CALLBACK_URL` in `m4-channels-ux/.env`
- **Python activation fails**: run PowerShell as normal user and recreate venv

---

## 11) Recommended Demo Flow

1. Start M1, M3, M4, M2
2. Show health endpoints
3. Trigger `/conflict`
4. Tap Telegram button
5. Show M1 override log and returned decision
6. Run `node index.js --url http://localhost:5000/decision` in M2 terminal
7. Show M1 `/ack` log (`[M2] Actions Acknowledged`)

This demonstrates the full **Conflict → User Input → M1 Override → Action pipeline**.
