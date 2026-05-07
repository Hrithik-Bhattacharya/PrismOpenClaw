# Phantom Mode — M4: Communication Layer

Telegram-based conflict management and notification system.  
Receives signals from **M1** (Pi Engine) and **M3** (context sensors), pushes messages to the user, and forwards decisions back to M1.

---

## Setup

```bash
cd phantom_m4
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your tokens
python main.py
```

---

## Environment variables

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your personal chat ID (send `/start` to the bot, then check `getUpdates`) |
| `M3_API_TOKEN` | Shared secret between M3/M1 and M4 — any random string |
| `M1_CALLBACK_URL` | Where M4 POSTs user decisions (default `http://localhost:8001/persona-decision`) |

---

## API endpoints

All POST endpoints require header: `x-api-token: <M3_API_TOKEN>`

| Method | Path | Caller | Purpose |
|---|---|---|---|
| POST | `/conflict` | M1 | Two personas clash — sends inline button message |
| POST | `/stress-alert` | M3 | Stress detected — sends calm notification |
| POST | `/morning-brief` | M1 | Daily schedule summary |
| POST | `/persona-suggestion` | M1 | AI-suggested persona with accept/edit |
| GET | `/health` | any | Liveness check |

---

## Integration flow

```
M3 ──stress──▶ POST /stress-alert ──▶ Telegram user
M1 ──conflict▶ POST /conflict     ──▶ Telegram inline buttons
                                          │ user taps
                                          ▼
                               POST M1_CALLBACK_URL
                               { selected_persona, timestamp, source }
```

---

## Demo / testing

```bash
# Run all scenarios against local server
python tests/payloads.py all

# Single scenario
python tests/payloads.py conflict
python tests/payloads.py stress
python tests/payloads.py brief
python tests/payloads.py suggestion
```
