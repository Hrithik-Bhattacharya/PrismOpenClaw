# 📱 M2: Android & ADB Control

**Status:** ⏳ Pending Implementation
**Owner:** Member 2

This module receives persona actions from the **PI Engine (M1)** and executes them on the physical Android device via ADB.

## 🎯 Your Goals

1. Read the standardized `actions` array sent by M1.
2. Translate those actions into exact ADB commands.
3. Execute the commands on the connected device.

## 🤝 Integration with M1

You should NOT write decision logic. Your module is purely an execution layer. 

M1 will output JSON like this:
```json
{
  "persona": "work",
  "actions": ["enable_dnd", "mute_social_apps"]
}
```

You must map these action strings to ADB commands and execute them. Please read `TEAM_INTEGRATION.md` in the `pi-engine` folder for the full list of required ADB mappings.

## 🔑 Environment Setup

Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
