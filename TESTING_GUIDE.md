# PrismOpenClaw Full Integration Testing Guide

Use this document to verify whether the full system is properly integrated:

- **M1** (pi-engine API + decision brain)
- **M2** (Android/ADB executor + ACK)
- **M3** (context producer)
- **M4** (Telegram + Twilio/WhatsApp channel layer)

This is designed as a **step-by-step pass/fail checklist** for demo readiness.

---

## 0) Test Objective

You should be able to prove all of these:

1. M3 sends context to M1
2. M1 produces decision payloads with actions
3. M2 consumes actions and sends ACK to M1
4. M4 receives events and sends Telegram notifications
5. Conflict user input (Telegram tap) reaches M1 `/override`
6. Twilio WhatsApp morning brief path works (or cleanly degrades if credentials missing)

---

## 1) Pre-Test Checklist

### 1.1 Required terminals

Open 4 terminals:

- **T1:** M1 (`pi-engine`)
- **T2:** M3 (`m3-context-engine`)
- **T3:** M4 (`m4-channels-ux`)
- **T4:** M2 (`m2-android-adb`)

### 1.2 .env consistency checks

- Shared token must match across M1/M3/M4:
  - `pi-engine/.env` → `M3_API_TOKEN=...`
  - `m3-context-engine/.env` → `M1_API_TOKEN=...`
  - `m4-channels-ux/.env` → `M3_API_TOKEN=...`

- M4 override callback:
  - `M1_CALLBACK_URL=http://localhost:5000/override`

- M2 M1 URL:
  - `m2-android-adb/.env` → `M1_API_URL=http://localhost:5000`

### 1.3 Telegram/Twilio prerequisites

- Telegram:
  - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` valid in `m4-channels-ux/.env`
- Twilio WhatsApp (optional but recommended):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER` (typically `whatsapp:+14155238886` for sandbox)
  - `WHATSAPP_TO_NUMBER` (format `whatsapp:+<countrycode><number>`)

---

## 2) Startup Sequence

## 2.1 Start M1 (T1)
```powershell
cd C:\Coding\PrismOpenClaw\pi-engine
npm install
node apiWrapper.js
```

**PASS if:** console shows API server running on port 5000.

## 2.2 Start M3 (T2)
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
.\venv_m3\Scripts\Activate.ps1
python src/main.py
```

**PASS if:** periodic cycle logs appear and context sending succeeds.

## 2.3 Start M4 (T3)
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
.\venv_m4\Scripts\Activate.ps1
python main.py
```

**PASS if:** server starts and `/health` responds `{"status":"ok"}`.

## 2.4 Prepare M2 (T4)
```powershell
cd C:\Coding\PrismOpenClaw\m2-android-adb
copy .env.example .env
node index.js --status
```

**PASS if:** status command runs and M1 API is reachable.

---

## 3) API Health Tests

Run from any terminal:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:8000/health
```

### Pass criteria
- M1 health returns JSON with module status and no crash
- M4 health returns `status: ok`

---

## 4) M3 → M1 Context Integration Test

### Method A (live M3 cycles)
Observe logs:
- M3: successful context push
- M1: context received / decision cycles

### Method B (manual inject)
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/context `
  -ContentType "application/json" `
  -Body '{"location":"office","calendar_event":"Daily Standup","upcoming_event":"Project Review","time_to_event":14,"stress":0.45,"battery":82,"notifications":3,"activity":"working"}'
```

**PASS if:** M1 returns success and no validation error.

---

## 5) M1 Decision Contract Test

### Trigger cycle
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/decision
```

### Fetch latest decision
```powershell
Invoke-RestMethod http://localhost:5000/decision/latest
```

**PASS if response contains:**
- `persona`
- `actions` (array)
- `reason`
- `requires_user_input`
- `timestamp`

---

## 6) M1 → M2 Execution + ACK Test

## 6.1 Safe dry run
```powershell
cd C:\Coding\PrismOpenClaw\m2-android-adb
node index.js --url http://localhost:5000/decision/latest --dry-run
```

**PASS if:** action mapping prints without runtime error.

## 6.2 Real execution path (if ADB connected)
```powershell
node index.js --url http://localhost:5000/decision
```

**PASS if:**
- M2 prints action execution logs
- M2 prints `Ack sent successfully`
- M1 logs show `[M2] Actions Acknowledged`

> Note: if no device is connected, use dry-run and still validate decision parsing.

---

## 7) M1/M3 → M4 Channel Tests (Telegram + WhatsApp)

## 7.1 Run built-in M4 payload tests
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
.\venv_m4\Scripts\Activate.ps1
python tests/payloads.py all
```

This tests:
- `/conflict`
- `/stress-alert`
- `/morning-brief`
- `/persona-suggestion`
- `/decision`

**PASS if:** API responses are 200 and expected channel side-effects occur.

## 7.2 Telegram conflict test (manual)
```powershell
$token = "<same M3_API_TOKEN>"
Invoke-RestMethod -Method Post -Uri http://localhost:8000/conflict `
  -Headers @{"x-api-token"=$token} `
  -ContentType "application/json" `
  -Body '{"persona_a":"work","persona_b":"fitness"}'
```

**PASS if:** Telegram gets inline buttons.

## 7.3 Conflict user-input callback test (critical)

User taps a Telegram button.

**PASS if:**
- M4 sends callback payload to `M1_CALLBACK_URL`
- M1 logs: `USER OVERRIDE REQUESTED: Switch to -> ...`
- M1 override response includes success + updated decision

---

## 8) Twilio WhatsApp Test

Twilio is triggered by `/morning-brief` in M4.

## 8.1 API trigger
```powershell
$token = "<same M3_API_TOKEN>"
Invoke-RestMethod -Method Post -Uri http://localhost:8000/morning-brief `
  -Headers @{"x-api-token"=$token} `
  -ContentType "application/json" `
  -Body '{"personas":[{"time":"08:00","persona":"WORK","conflict":false},{"time":"15:00","persona":"INTERVIEW","conflict":true}]}'
```

## 8.2 Pass/fail criteria

- **PASS (configured):**
  - M4 logs: `WhatsApp morning brief sent successfully`
  - message arrives in configured WhatsApp destination

- **PASS (graceful fallback):**
  - if Twilio creds absent, M4 logs warning and service does not crash

- **FAIL:**
  - server exception/crash
  - repeated auth errors with valid credentials

---

## 9) End-to-End “System Integrated?” Final Checklist

Mark all for “fully integrated”:

- [ ] M1 API up and healthy
- [ ] M3 cycles active and context accepted by M1
- [ ] M1 produces valid decision payload with actions
- [ ] M2 fetches decisions from M1 endpoint
- [ ] M2 sends ACK and M1 receives it
- [ ] M4 endpoints authenticated by shared token
- [ ] Telegram receives conflict/decision/stress messages
- [ ] Telegram user selection reaches M1 override endpoint
- [ ] Twilio WhatsApp morning brief sends (or degrades cleanly)
- [ ] No module crash during 10+ minute run

If all checked: ✅ **System is properly integrated**.

---

## 10) Common Failure Patterns

- `401 Unauthorized` on M4 routes → token mismatch
- M2 cannot ack M1 → wrong `M1_API_URL` in `m2-android-adb/.env`
- No Telegram output → invalid bot token/chat ID
- No WhatsApp output → bad Twilio SID/token or wrong `whatsapp:+` number format
- M1 not reflecting override → wrong `M1_CALLBACK_URL` in M4 env

---

## 11) Recommended Evidence to Capture (for demo/judging)

Capture screenshots/log snippets for:

1. M1 `/health` JSON
2. M3 cycle log + M1 context receipt
3. Decision payload with `actions`
4. M2 execution + ACK success
5. Telegram conflict message with inline buttons
6. M1 override log after button tap
7. WhatsApp morning brief delivery/log

These 7 proofs make integration credibility very strong.
