# 📱 M2: Android & ADB Control

**Status:** ✅ Complete Implementation
**Owner:** Member 2

This module receives persona actions from the **PI Engine (M1)** and executes them on an Android device via ADB.

## 🎯 What This Module Does

- Reads a standardized decision payload containing `actions`.
- Maps each action to a pre-defined ADB command.
- Executes the command on the connected Android device.
- Logs unknown actions and continues without blocking the engine.

## ✅ What Was Implemented

- `index.js` — CLI launcher and executor for action payloads.
- `ACTION_MAPPING.md` — complete action-to-ADB command contract.
- `.gitignore` — ignores local `.env` and `node_modules`.
- `package.json` — lightweight module metadata and scripts.

## 🔧 Setup

1. Copy `.env.example` to `.env` in this folder.
```powershell
copy .env.example .env
```
2. Modify `ADB_HOST`, `ADB_PORT`, and optionally `M1_API_URL`.

## ▶️ Running the Executor

From `m2-android-adb/`:

```powershell
node index.js --help
```

### Execute from a local file

```powershell
node index.js --file ./decision.json
```

### Execute from a JSON string

```powershell
node index.js --json '{"actions":["enable_dnd","open_calendar"]}'
```

### Dry-run mode (no ADB execution)

```powershell
node index.js --file ./decision.json --dry-run
```

### Fetch and execute from a remote endpoint

```powershell
node index.js --url http://localhost:5000/decision
```

> When using `--url`, M2 will execute the decision payload and automatically send an acknowledgement back to M1 via `POST /ack`.

## 📚 Action Mapping Reference

The supported action keys and their ADB command mappings are documented in `ACTION_MAPPING.md`.

## 📌 Integration Notes

- M2 is intentionally stateless and does not make persona decisions.
- It consumes only the `actions` array from the M1 decision payload.
- Unknown action keys are logged as warnings so new actions can be added safely.

## 📝 Notes for Teammates

- Add any new M1 action keys to both `ACTION_MAPPING.md` and `index.js`.
- If the Android device is remote, set `ADB_HOST` and `ADB_PORT` in `.env`.
- Keep `M1_API_URL` aligned with the running PI Engine if you use `--url`.
