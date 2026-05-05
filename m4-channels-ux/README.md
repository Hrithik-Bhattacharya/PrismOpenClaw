# 💬 M4: Channels & UX Layer

**Status:** ⏳ Pending Implementation
**Owner:** Member 4

This module is the "face" of the project. It connects to Telegram to notify the user of persona changes, explain the AI's reasoning, and handle manual overrides.

## 🎯 Your Goals

1. Run a Telegram Bot.
2. Listen for decisions from **PI Engine (M1)** and notify the user (e.g., "🧘 Switching to Calm Mode").
3. Display the Explainable AI report so judges can see *why* a decision was made.
4. Handle conflicts by asking the user via Telegram buttons.
5. Send manual override commands back to M1.

## 🤝 Integration with M1

M1 outputs a massive JSON object for every decision. You care about these fields:
- `persona`
- `reason`
- `explanation.full_report`
- `requires_user_input` and `conflict`

Read `TEAM_INTEGRATION.md` in the `pi-engine` folder for code examples on how to handle the Telegram inline keyboard for conflicts.

## 🔑 Environment Setup

Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
