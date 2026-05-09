# Phantom Mode

**Team:** AutoMind Collective

**Adaptive Persona Intelligence System** for proactive device behavior.

## 📌 GitHub Submission Checklist (Quick Access)

- [x] **Source Code** (this repository)
- [x] **Presentation (PPT):** https://docs.google.com/presentation/d/1_rJozbBg6PoBs7a9TbzsIw7rPPlysWJ_ONlItV5eGs8/edit?usp=sharing
- [x] **Video Demo:** https://youtu.be/X3qt0fVUqBo
- [x] **AI Disclosure:** https://docs.google.com/document/d/1bk8weF_tbno0ggiHZLCtnNyUkpqPM1BJIridfvl5UWU/edit?usp=sharing
- [x] **README** (this file)
- [x] **APK/SDK (if any):** **Android SDK Platform-Tools (ADB)** used via in-repo module `m2-android-adb/` (Node.js ADB execution layer)

### 📂 Added Submission Documents (In This Repo)

- [PPT (PDF Export) — `RV College of Engineering_AutoMind Collective.pdf`](./RV%20College%20of%20Engineering_AutoMind%20Collective.pdf)
- [AI Disclosure (DOCX) — `OpenClaw_AI_Disclosure (1).docx`](./OpenClaw_AI_Disclosure%20(1).docx)

## README Structure (Required)

### Problem
Smartphone behavior is often context-blind, forcing manual switching (DND, focus, app behavior) during meetings, study, interviews, or workouts.

### Solution
Phantom Mode is an OpenClaw-inspired adaptive system that uses context signals, explainable decisioning, Android action execution, and user override via Telegram.

### Setup
- Start from: [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
- Environment and modules:
  - `pi-engine/`
  - `m2-android-adb/`
  - `m3-context-engine/`
  - `m4-channels-ux/`

### Instructions
- Full integration validation: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- Live walkthrough flow: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- Architecture reference: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Usage
- Trigger decisions through M1 API (`/decision`, `/decision/latest`)
- Execute actions through M2 (dry-run or live ADB)
- Receive user-facing updates/conflicts in Telegram via M4
- Use override path to send user choice back to M1 (`/override`)

### Telegram Bot (M4)

- **Bot link:** https://t.me/phantom_m4_bot
- **Important:** Do NOT store the bot token in this repository. Keep the token secret.
- **How to configure:** set the token using an environment variable named `TELEGRAM_BOT_TOKEN` or store it in your CI/CD secrets manager.
- **Local dev:** copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN` there (never commit your `.env`).


## 4. GitHub Repo must include

a. **Project Video Demo** -> Explaining the solution & Walkthrough - **MUST FOR THE EVALUATION**  
b. **Complete Source Code**  
c. **README** ( Problem, solution, setup, instructions, usage )  
d. **AI Disclosure** ( Clearly mention how AI tools/models were used )  
e. **PPT - MUST** (UNDERSTANDING WHAT YOU HAVE BUILT!! ) -> format attached  
f. **APK/SDK ( if any )**

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

## Demo Video

- **Project walkthrough video (MANDATORY):** `TODO_ADD_DRIVE_OR_YOUTUBE_LINK`
- Suggested title: `Phantom Mode - Problem, Solution, Live Walkthrough`

## PPT

- **Evaluation PPT (MANDATORY):** `TODO_ADD_PPT_FILE_LINK_OR_PATH`
- Recommended repo path: `submission/PPT/PhantomMode_Final.pptx`

## APK / SDK Artifacts (if any)

- **APK download:** `TODO_ADD_APK_LINK_OR_PATH`
- **SDK / tooling bundle:** `TODO_ADD_SDK_LINK_OR_PATH`

> SDK Note: This project explicitly uses **Android SDK Platform-Tools (ADB)** as the SDK/tooling layer, integrated through the in-repo module `m2-android-adb/` for device action execution.

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