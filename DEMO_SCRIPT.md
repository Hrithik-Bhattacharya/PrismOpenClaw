# Phantom Mode — Judge Demo Script

Use this script to present the integrated system smoothly in **4–6 minutes**.

---

## 0) Demo Goal (opening line)

> "Phantom Mode proactively adapts phone behavior using real-time context, explains every decision, executes actions, and lets the user override instantly through Telegram."

---

## 1) Pre-Demo Setup (before judges arrive)

Start all modules in separate terminals:

### Terminal 1 — M1
```powershell
cd C:\Coding\PrismOpenClaw\pi-engine
node apiWrapper.js
```

### Terminal 2 — M3
```powershell
cd C:\Coding\PrismOpenClaw\m3-context-engine
.\venv_m3\Scripts\Activate.ps1
python src/main.py
```

### Terminal 3 — M4
```powershell
cd C:\Coding\PrismOpenClaw\m4-channels-ux
.\venv_m4\Scripts\Activate.ps1
python main.py
```

### Terminal 4 — M2
```powershell
cd C:\Coding\PrismOpenClaw\m2-android-adb
node index.js --status
```

---

## 2) Live Demo Steps

## Step A — Health and architecture check (30 sec)

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:8000/health
```

Say:
- "M1 brain API and M4 communication layer are up."
- "M3 pushes context into M1 continuously."

---

## Step B — Trigger a real decision (60 sec)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/decision
```

Show:
- `persona`
- `actions`
- `reason`
- `explanation.full_report`

Say:
- "This is explainable AI: not just output, but the full reasoning chain."

---

## Step C — Show Telegram explainability (45 sec)

Open Telegram message from M4 decision push.

Show:
- Target mode
- Trigger reason
- Neural explanation report

Say:
- "The same explainability is delivered to user-facing channel in real time."

---

## Step D — Conflict + override loop (90 sec)

Trigger conflict manually:

```powershell
$token = "<same M3_API_TOKEN>"
Invoke-RestMethod -Method Post -Uri http://localhost:8000/conflict `
  -Headers @{"x-api-token"=$token} `
  -ContentType "application/json" `
  -Body '{"persona_a":"work","persona_b":"fitness"}'
```

Then in Telegram:
- Tap one option.

Show in M1 logs:
- `USER OVERRIDE REQUESTED: Switch to -> ...`

Say:
- "Human remains in control; one-tap override is applied instantly by M1."

---

## Step E — M2 execution layer (60 sec)

Safe mode demonstration:

```powershell
node index.js --url http://localhost:5000/decision/latest --dry-run
```

Show action→ADB command mapping output.

If device + ADB ready, run real path:

```powershell
node index.js --url http://localhost:5000/decision
```

Show in M1 logs:
- `[M2] Actions Acknowledged`

Say:
- "This closes the loop from AI decision to executable device controls."

---

## Step F — WhatsApp channel (30 sec)

Show M4 logs where available:
- `WhatsApp decision update sent successfully`
- `WhatsApp morning brief sent successfully`

Say:
- "Beyond Telegram, we support WhatsApp delivery through Twilio for multi-channel UX."

---

## 3) Closing Statement (15 sec)

> "Phantom Mode is a full-stack adaptive system: context intelligence, explainable decisions, action execution, and human override — all integrated and testable end-to-end."

---

## 4) Backup Lines (if something delays)

- If ADB device is unavailable:
  - "We’ll show deterministic dry-run mapping, and the ACK path remains part of the tested contract."
- If WhatsApp delivery is delayed:
  - "Twilio SID confirms dispatch; delivery status can lag by network/sandbox constraints."

---

## 5) Quick Command Block (copy-paste)

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod -Method Post -Uri http://localhost:5000/decision
node C:\Coding\PrismOpenClaw\m2-android-adb\index.js --url http://localhost:5000/decision/latest --dry-run
```
