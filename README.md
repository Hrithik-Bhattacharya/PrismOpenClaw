# Phantom Mode

**Team:** AutoMind Collective

**Adaptive Persona Intelligence System** for proactive device behavior.

Phantom Mode combines context sensing, decision intelligence, device execution, and user-facing channels into one integrated pipeline:

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

## 🏁 Evaluation Submission Checklist (Must Include in GitHub Repo)

Use this as the final packaging checklist before submission:

- [ ] **Project Video Demo (MANDATORY)**
  - Explain the problem, architecture, and solution flow
  - Walk through real execution (context → decision → Telegram/ADB/override)
  - Add link in this README under a `## Demo Video` section

- [ ] **Complete Source Code**
  - Include all modules (`pi-engine`, `m2-android-adb`, `m3-context-engine`, `m4-channels-ux`)
  - Ensure no secrets are committed (`.env` excluded)

- [ ] **README (MANDATORY CONTENT)**
  - Problem statement
  - Solution approach
  - Setup instructions
  - Run instructions
  - Usage/testing instructions

- [ ] **AI Disclosure (MANDATORY)**
  - Clearly mention which AI tools/models were used
  - Mention where AI assisted (e.g., code drafting, debugging, docs, test scripting)
  - Mention what was human-implemented/reviewed
  - Add a dedicated `## AI Disclosure` section in README

- [ ] **PPT Deck (MANDATORY)**
  - Must follow the attached evaluation format
  - Focus on understanding: architecture, module responsibilities, demo proof, limitations, future scope

- [ ] **APK/SDK (if any)**
  - If APK exists, upload under a release/artifacts folder and link it in README
  - If SDK/tooling bundle exists, include usage steps and compatibility notes

### Suggested README section order for evaluators

1. `## Problem`
2. `## Solution`
3. `## Architecture`
4. `## Setup`
5. `## Run`
6. `## Usage / Testing`
7. `## Demo Video`
8. `## AI Disclosure`
9. `## Team / Credits`

---

## Demo Video

- **Project walkthrough video (MANDATORY):** `TODO_ADD_DRIVE_OR_YOUTUBE_LINK`
- Suggested title: `Phantom Mode - Problem, Solution, Live Walkthrough`

## PPT

- **Evaluation PPT (MANDATORY):** `TODO_ADD_PPT_FILE_LINK_OR_PATH`
- Recommended repo path: `submission/PPT/PhantomMode_Final.pptx`

## APK / SDK Artifacts (if any)

- **APK download:** `TODO_ADD_APK_LINK_OR_PATH`
- **SDK / tooling bundle:** `TODO_ADD_SDK_LINK_OR_PATH`

> SDK Note: This project uses the in-repo Android ADB execution module at `m2-android-adb/` as the SDK/tooling component for device action execution.

## AI Disclosure

> Replace this placeholder with your final disclosure before submission.

**AI tools/models used:** `TODO_LIST_TOOLS_AND_MODELS`

**How AI was used in this project:**
- `TODO`: brainstorming / architecture discussion
- `TODO`: code drafting or refactoring support
- `TODO`: debugging support
- `TODO`: documentation/test-script generation

**Human ownership and verification:**
- Final architecture decisions: `TODO_TEAM_MEMBER_NAMES`
- Code review and validation: `TODO_TEAM_MEMBER_NAMES`
- Final demo/testing sign-off: `TODO_TEAM_MEMBER_NAMES`

---

## ⚠️ Notes

- For real M2 phone control, **ADB must be installed**.
- Without ADB, M2 can still be validated via `--dry-run`.
- Keep all `.env` files local (already protected by `.gitignore`).

---

Built for Samsung Clash of the Claws Hackathon — AutoMind Collective.

Inspired by OpenClaw concepts and adapted into this project architecture.