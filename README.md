# PrismOpenClaw

**Adaptive Persona Intelligence System** for proactive device behavior.

PrismOpenClaw combines context sensing, decision intelligence, device execution, and user-facing channels into one integrated pipeline:

**M3 Context → M1 Decision + Explainability → M2 Action Execution → M4 User Communication/Override**

---

## ✅ Current Project Status

- **M1 (Brain / API):** Integrated and running
- **M2 (ADB Executor):** Integrated (real mode with ADB, dry-run without ADB)
- **M3 (Context Engine):** Integrated and posting context to M1
- **M4 (Telegram + WhatsApp):** Integrated, including decision push and override callback
- **Explainable AI:** Integrated end-to-end (decision payload + Telegram report)

---

## 🧠 Core Features

1. **Predictive Persona Switching**
   - Pre-acts on upcoming events (e.g., meeting soon).

2. **Explainable AI Reports**
   - Every decision includes a full reasoning report (`explanation.full_report`).

3. **Conflict Handling via Telegram**
   - User receives conflict options and can override with one tap.

4. **Android Execution Layer (ADB)**
   - M2 maps `actions[]` from M1 to ADB commands.

5. **WhatsApp Notifications (Twilio)**
   - Morning brief + decision updates (credential-dependent).

6. **Fail-safe Integration Behavior**
   - Core flows continue even if optional channels are unavailable.

---

## 🚀 Judge / Evaluator Quick Start

Use this exact order:

1. **Startup Guide** → [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
2. **Testing Guide** → [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. **Live Demo Script** → [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)

If you only read one validation doc, read **TESTING_GUIDE.md**.

---

## 🧪 What Judges Can Verify Quickly

- `GET /health` on M1 and M4
- `POST /decision` returns full explainability report
- Telegram receives persona transition + explanation
- Telegram conflict tap posts override to M1
- M2 dry-run executes action mapping from decision payload
- Twilio logs decision/brief dispatch when configured

---

## 📂 Module Overview

### 🧠 M1 — `pi-engine/`
Decision brain + APIs:
- `/context`, `/decision`, `/decision/latest`, `/override`, `/ack`, `/health`
- Confidence scoring, predictive logic, transitions, explainability

### 📱 M2 — `m2-android-adb/`
ADB execution layer:
- consumes M1 decision payload
- maps actions to ADB commands
- sends ACK back to M1

### 📡 M3 — `m3-context-engine/`
Context sensing engine:
- builds normalized context
- pushes to M1 every heartbeat

### 💬 M4 — `m4-channels-ux/`
Communication & override layer:
- Telegram decision/conflict/stress notifications
- callback to M1 override endpoint
- Twilio WhatsApp morning brief + decision updates

---

## 📚 Documentation Map

### Primary (Judge-Facing)
- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

### Secondary (Team/Internal Deep-Dive)
- [TEAM_FLOW.md](./TEAM_FLOW.md)
- [FEATURE_AUDIT.md](./FEATURE_AUDIT.md)
- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
- [DEMO_PLAN.md](./DEMO_PLAN.md)

---

## ⚠️ Notes

- For real M2 phone control, **ADB must be installed**.
- Without ADB, M2 can still be validated via `--dry-run`.
- Keep all `.env` files local (already protected by `.gitignore`).

---

Built for Samsung Clash of the Claws Hackathon — PrismOpenClaw Team.