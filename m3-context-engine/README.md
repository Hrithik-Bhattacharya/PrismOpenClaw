# 🧠 M3: Sensors & Context Engine

**Status:** ⏳ Pending Implementation
**Owner:** Member 3

This module reads real-world data (calendar, GPS location, stress from wearables, battery) and formats it into a single standardized JSON payload.

## 🎯 Your Goals

1. Connect to data sources (e.g., Google Calendar API, Android GPS, wearable APIs).
2. Gather current context data.
3. Push this data to the **PI Engine (M1)** every few seconds (or when an event occurs).

## 🤝 Integration with M1

M1 expects a very specific JSON schema. If fields are missing, M1 might fail or use defaults.

Example of what you must send to M1:
```json
{
  "location": "office",
  "calendar_event": "Daily Standup",
  "upcoming_event": "Project Review",
  "time_to_event": 14,
  "stress": 0.45,
  "battery": 82,
  "notifications": 3,
  "activity": "working"
}
```

Read `TEAM_INTEGRATION.md` in the `pi-engine` folder for the exact specifications of each field.

## 🔑 Environment Setup

Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
