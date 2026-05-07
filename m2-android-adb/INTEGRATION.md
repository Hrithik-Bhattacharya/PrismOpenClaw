# M2 ↔ M1 Integration Guide

This document explains how the Android execution module (M2) integrates with the PI Engine (M1).

## 1. Required M1 endpoints

M1 exposes the following endpoints through `pi-engine/apiWrapper.js`:

- `GET /health` — health dashboard
- `POST /decision` — trigger a new decision cycle and receive the latest decision output
- `GET /decision` — fetch the latest decision without forcing a cycle
- `POST /ack` — send action execution acknowledgement from M2
- `POST /context` — send sensor data from M3
- `POST /override` — send user override from M4

## 2. How M2 consumes decisions

M2 is configured by `M1_API_URL` in `m2-android-adb/.env`.
By default, it uses `http://localhost:5000`.

Example:

```powershell
node index.js --url http://localhost:5000/decision
```

This fetches the latest decision payload from M1, executes the listed `actions`, and then sends an acknowledgement back to M1.

## 3. Acknowledgement handshake

After M2 executes actions, it sends a POST request to M1 at:

```text
POST /ack
```

Payload format:

```json
{
  "ack": true,
  "actions_executed": ["enable_dnd", "open_calendar"],
  "errors": []
}
```

If M1 does not receive the acknowledgement quickly, it logs a degraded M2 connection.

## 4. Local execution

To use a local decision file for testing while still sending an acknowledgement to M1:

```powershell
node index.js --file ./sample-decision.json
```

If `M1_API_URL` is configured, M2 will post an ack automatically after execution.

## 5. Notes for teammates

- If M1 is running on a different host, update `M1_API_URL` in `.env`.
- The ack endpoint is automatic and enabled unless `M1_API_URL` is unset.
- For dry-run testing, add `--dry-run` to skip actual ADB execution and ack transmission.
