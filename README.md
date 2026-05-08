# PrismOpenClaw - Master Architecture

Welcome to the **PrismOpenClaw** hackathon project! This repository contains the complete Persona Intelligence system.

The project is split into four distinct modules, each owned by a different team member. This ensures no one overwrites each other's code.

## 📂 Repository Structure

### 🧠 1. [pi-engine (M1) - The Brain](./pi-engine/README.md)
**Status: ✅ 100% COMPLETE** (Done by Member 1)
The core intelligence loop. It takes in context, uses rules + AI to pick a persona, calculates confidence, manages smooth transitions, and outputs exact execution instructions.
- **Start here:** Read [TEAM_INTEGRATION.md](./pi-engine/TEAM_INTEGRATION.md) to understand how to connect your modules to the engine.

### 📱 2. [m2-android-adb (M2) - Execution Layer](./m2-android-adb/README.md)
**Status:** ✅ 100% COMPLETE (Member 2)
Translates the JSON actions from M1 into physical ADB commands on the Android device (muting notifications, changing brightness, launching apps).

### 📡 3. [m3-context-engine (M3) - Sensors](./m3-context-engine/README.md)
**Status: ⏳ TO DO** (Member 3)
Gathers real-world data (Google Calendar, GPS, wearable stress levels) and pushes a standardized JSON context payload to M1.

### 💬 4. [m4-channels-ux (M4) - User Interface](./m4-channels-ux/README.md)
**Status: ⏳ TO DO** (Member 4)
The Telegram bot interface. Notifies the user of changes, displays the Explainable AI reasoning report, and handles manual overrides via chat buttons.

## 📚 Essential Team Documentation (READ THESE FIRST)

Before writing any code, every teammate MUST read these three files to understand the execution discipline and architecture:

1. 📄 **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System diagram and strict module responsibilities.
2. 📄 **[TEAM_FLOW.md](./TEAM_FLOW.md)** — End-to-end execution flows, integration phases, and your specific next tasks.
3. 📄 **[DEMO_PLAN.md](./DEMO_PLAN.md)** — The exact script and narrative we are presenting to the judges.

---

## 🚀 Getting Started for Teammates

1. **Read the Docs**: Open `pi-engine/TEAM_INTEGRATION.md` and the 3 files linked above. This is the holy grail of how everything fits together.
2. **Find your folder**: Go to `m2-android-adb`, `m3-context-engine`, or `m4-channels-ux`.
3. **Setup your environment**: Copy `.env.example` to `.env` in your respective folder and fill out your API keys.
4. **Build & Test**: Keep testing against M1's output.

> Need to see the engine in action? Run `npm run demo` inside the `pi-engine/` folder to watch a full simulated day!