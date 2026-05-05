# 🤝 PI ENGINE — TEAM INTEGRATION GUIDE

> **READ THIS FIRST** before touching any integration code.
> This document is the single source of truth for how M1 (Pi Engine) connects
> to M2 (Android/ADB), M3 (Context Engine), and M4 (Telegram/UX).

---

## 📑 TABLE OF CONTENTS

1. [API Keys & Environment Setup](#1-api-keys--environment-setup)
2. [Standardized Output Contract](#2-standardized-output-contract)
3. [Context Input Contract (For M3)](#3-context-input-contract-for-m3)
4. [Action Mapping Layer (For M2)](#4-action-mapping-layer-for-m2)
5. [Conflict → User Handoff (For M4)](#5-conflict--user-handoff-for-m4)
6. [State Management](#6-state-management)
7. [Failsafe / Fallback System](#7-failsafe--fallback-system)
8. [API Wrapper — Plug & Play Interface](#8-api-wrapper--plug--play-interface)
9. [Real-Time Event Hooks](#9-real-time-event-hooks)
10. [Persona Override Support](#10-persona-override-support)
11. [Who Changes What File](#11-who-changes-what-file)
12. [Integration Checklist](#12-integration-checklist)

---

## 1. API Keys & Environment Setup

### Step 1: Create your `.env` file

Navigate to `pi-engine/` and create a file called `.env`:

```bash
cd pi-engine
cp .env.example .env
```

### Step 2: Fill in your keys

Open `.env` and replace the placeholder values:

```env
# ─────────────────────────────────────────────────────────────────
# 🧠 MULTI-LLM PROVIDER (Groq + Gemini)
# Used by M1 (Pi Engine) for ultra-fast, zero vendor lock-in decisions.
# LLM_PROVIDER can be 'groq', 'gemini', or 'auto'
# ─────────────────────────────────────────────────────────────────
LLM_PROVIDER=auto
GROQ_API_KEY=your-groq-key-here
GEMINI_API_KEY=your-gemini-key-here

# ─────────────────────────────────────────────────────────────────
# 🤖 TELEGRAM — Used by M4 (Channels/UX) to send notifications
# How to get:
#   1. Open Telegram, search for @BotFather
#   2. Send /newbot → follow prompts
#   3. Copy the token it gives you
#   4. For CHAT_ID: message @userinfobot in Telegram
# ─────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_CHAT_ID=your-telegram-chat-id-here

# ─────────────────────────────────────────────────────────────────
# 📡 M3 API — Used by M3 (Context Engine) to push live data to M1
# M3 team fills this in when their API is running
# ─────────────────────────────────────────────────────────────────
M3_API_URL=http://localhost:4000
M3_API_TOKEN=your-m3-api-token-here

# ─────────────────────────────────────────────────────────────────
# ⚙️  ENGINE CONFIG — Leave these as-is unless you know what you do
# ─────────────────────────────────────────────────────────────────
HEARTBEAT_INTERVAL=10000
MEMORY_ENABLED=true
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=200
DEBUG=false
LOG_LEVEL=info
```

### Key Ownership Table

| Key | Who Gets It | Who Uses It | Required? |
|-----|------------|-------------|-----------|
| `GROQ_API_KEY` | M1 gets from Groq | M1 (`llmEngine.js`) | Optional but recommended |
| `GEMINI_API_KEY` | M1 gets from Google | M1 (`llmEngine.js`) | Optional but recommended |
| `TELEGRAM_BOT_TOKEN` | M4 team creates via @BotFather | M4 (Telegram bot) | Required for M4 |
| `TELEGRAM_CHAT_ID` | M4 team from @userinfobot | M4 (send messages) | Required for M4 |
| `M3_API_TOKEN` | M3 team generates | M1 (contextReader.js) | Required for M3 |
| `M3_API_URL` | M3 team provides their URL | M1 (contextReader.js) | Required for M3 |

> ⚠️ **NEVER commit `.env` to Git.** It's already in `.gitignore`. If you accidentally push it, rotate all your keys immediately.

---

## 2. Standardized Output Contract

**This is the single JSON schema that M1 outputs after every decision.**
M2 reads `actions`. M4 reads `reason` and `explanation`. M3 aligns its context format to this.

### ✅ FINAL OUTPUT SCHEMA (DO NOT CHANGE WITHOUT TELLING EVERYONE)

```json
{
  "persona": "work",
  "confidence": 0.92,
  "is_predictive": false,

  "transition": {
    "type": "gradual",
    "from": "calm",
    "to": "work",
    "steps": ["reduce_notifications", "enable_focus"],
    "message": "💼 Preparing for your meeting."
  },

  "actions": [
    "enable_dnd",
    "open_calendar",
    "mute_social_apps",
    "set_brightness_high"
  ],

  "reason": "Meeting in 10 minutes (predictive)",

  "explanation": {
    "top_signals": [
      { "signal": "calendar",  "value": "Daily Standup", "confidence": 0.95 },
      { "signal": "location",  "value": "office",        "confidence": 0.90 },
      { "signal": "stress",    "value": 0.4,             "confidence": 0.75 }
    ],
    "decision_source": "rule_predictive",
    "full_report": "...explainEngine output..."
  },

  "requires_user_input": false,
  "conflict": null,

  "state": {
    "current_persona": "work",
    "previous_persona": "calm",
    "last_switch_time": "2026-05-05T09:45:00Z",
    "in_cooldown": false,
    "mode_duration_minutes": 0
  },

  "timestamp": "2026-05-05T09:45:00Z"
}
```

### When `requires_user_input` is `true` (Conflict case):

```json
{
  "persona": null,
  "confidence": null,
  "requires_user_input": true,

  "conflict": {
    "competing_personas": ["work", "fitness"],
    "scores": [
      { "persona": "work",    "score": 0.87 },
      { "persona": "fitness", "score": 0.85 }
    ],
    "message": "Gym and meeting overlap. Which do you want to prioritize?",
    "options": ["work", "fitness"],
    "timeout_default": "work"
  },

  "transition": null,
  "actions": [],
  "reason": "Conflict detected — user input required",
  "timestamp": "2026-05-05T12:00:00Z"
}
```

---

## 3. Context Input Contract (For M3)

**M3 must send context in THIS exact format.** M1 will crash or fallback to defaults if fields are missing.

### ✅ REQUIRED context.json / API payload format

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

### Field Reference

| Field | Type | Range / Values | Required | Description |
|-------|------|----------------|----------|-------------|
| `location` | string | `office`, `home`, `gym`, `commute`, or any custom string | ✅ Yes | Current physical location |
| `calendar_event` | string | Event name or `"none"` | ✅ Yes | Currently ACTIVE calendar event |
| `upcoming_event` | string or `null` | Event name or `null` | Optional | Next upcoming event name |
| `time_to_event` | number or `null` | Minutes (e.g. `14`) | Optional | Minutes until `upcoming_event` |
| `stress` | number | `0.0` – `1.0` | ✅ Yes | Stress level (0=calm, 1=max stress) |
| `battery` | number | `0` – `100` | ✅ Yes | Device battery % |
| `notifications` | number | `0` – `999` | ✅ Yes | Count of unread notifications |
| `activity` | string | `idle`, `working`, `exercising`, `in_meeting`, `commuting`, etc. | ✅ Yes | Current user activity |

### How M3 sends data to M1

**Option A — Write to file (simplest for demo):**
```javascript
// M3 just writes to pi-engine/context.json
const fs = require('fs');
fs.writeFileSync('../pi-engine/context.json', JSON.stringify(contextData, null, 2));
```

**Option B — HTTP POST (proper integration):**
```javascript
// M3 POSTs to M1's API endpoint
await fetch('http://localhost:5000/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${M3_API_TOKEN}` },
  body: JSON.stringify(contextData)
});
```

---

## 4. Action Mapping Layer (For M2)

**M2 should NOT think.** M1 provides exact action strings. M2 just executes them.

### ✅ Complete Action → ADB Command Mapping

```javascript
// This is what M2 should implement as their command executor
const ACTION_TO_ADB = {

  // ── FOCUS / WORK ─────────────────────────────────────────────
  "enable_dnd":            "adb shell settings put global zen_mode 1",
  "disable_dnd":           "adb shell settings put global zen_mode 0",
  "mute_notifications":    "adb shell settings put global notification_sound \"\"",
  "enable_focus":          "adb shell am start -a android.intent.action.MAIN -n com.android.settings/.Settings",
  "open_calendar":         "adb shell am start -a android.intent.action.VIEW -d content://com.android.calendar/events",
  "mute_social_apps":      "adb shell pm disable-user --user 0 com.instagram.android",
  "block_notifications":   "adb shell settings put global heads_up_notifications_enabled 0",
  "set_brightness_high":   "adb shell settings put system screen_brightness 200",

  // ── CALM / REST ───────────────────────────────────────────────
  "reduce_notifications":  "adb shell settings put global heads_up_notifications_enabled 0",
  "set_brightness_low":    "adb shell settings put system screen_brightness 30",
  "enable_night_mode":     "adb shell settings put secure ui_night_mode 2",
  "open_meditation_app":   "adb shell am start -a android.intent.action.MAIN -n com.calm.android/.MainActivity",
  "play_ambient_sound":    "adb shell am broadcast -a android.media.VOLUME_CHANGED_ACTION",

  // ── FITNESS ───────────────────────────────────────────────────
  "open_fitness_app":      "adb shell am start -a android.intent.action.MAIN -n com.google.android.apps.fitness/.MainActivity",
  "enable_screen_on":      "adb shell settings put system screen_off_timeout 600000",
  "start_activity_track":  "adb shell am broadcast -a com.fitness.START_TRACKING",

  // ── SLEEP ─────────────────────────────────────────────────────
  "silence_all":           "adb shell settings put global ringer_mode 0",
  "enable_night_filter":   "adb shell settings put secure accessibility_display_daltonizer_enabled 1",
  "set_brightness_min":    "adb shell settings put system screen_brightness 0",

  // ── POWER SAVER ───────────────────────────────────────────────
  "enable_power_saver":    "adb shell settings put global low_power 1",
  "reduce_updates":        "adb shell settings put global wifi_scan_interval_background_s 300",
  "disable_animations":    "adb shell settings put global window_animation_scale 0",

  // ── SOCIAL ────────────────────────────────────────────────────
  "enable_notifications":  "adb shell settings put global heads_up_notifications_enabled 1",
  "open_messaging":        "adb shell am start -a android.intent.action.MAIN -c android.intent.category.APP_MESSAGING",

};

// How M2 should use this:
async function executeActions(actions) {
  for (const action of actions) {
    const cmd = ACTION_TO_ADB[action];
    if (cmd) {
      await adb.execute(cmd);
      console.log(`✅ Executed: ${action}`);
    } else {
      console.warn(`⚠️  Unknown action: ${action}`);
    }
  }
}
```

### Action Sets Per Persona

| Persona | Actions M1 Will Send |
|---------|---------------------|
| `work` | `enable_dnd`, `open_calendar`, `mute_social_apps`, `set_brightness_high` |
| `fitness` | `open_fitness_app`, `enable_screen_on`, `disable_dnd`, `start_activity_track` |
| `calm` | `reduce_notifications`, `set_brightness_low`, `enable_night_mode`, `open_meditation_app` |
| `focus` | `block_notifications`, `enable_dnd`, `disable_animations` |
| `sleep` | `silence_all`, `enable_night_filter`, `set_brightness_min`, `enable_night_mode` |
| `power_saver` | `enable_power_saver`, `reduce_updates`, `disable_animations` |
| `relaxation` | `disable_dnd`, `enable_notifications`, `enable_night_mode` |
| `productivity` | `enable_dnd`, `set_brightness_high`, `block_notifications` |
| `social` | `enable_notifications`, `open_messaging`, `disable_dnd` |
| `learning` | `enable_dnd`, `set_brightness_high`, `mute_social_apps` |

---

## 5. Conflict → User Handoff (For M4)

When two personas are nearly tied in score (within `0.05` of each other), M1 flags it as a conflict and sets `requires_user_input: true`. M4 must handle this.

### What M4 receives:

```json
{
  "requires_user_input": true,
  "conflict": {
    "competing_personas": ["work", "fitness"],
    "message": "Gym and meeting overlap. Which do you want to prioritize?",
    "options": ["work", "fitness"],
    "timeout_default": "work"
  }
}
```

### What M4 should do:

```javascript
// In your Telegram bot (M4)
if (decision.requires_user_input) {
  const conflict = decision.conflict;

  // Send inline keyboard buttons to user
  await bot.sendMessage(CHAT_ID, `⚡ ${conflict.message}`, {
    reply_markup: {
      inline_keyboard: [
        conflict.options.map(opt => ({
          text: opt.toUpperCase(),
          callback_data: `override:${opt}`
        }))
      ]
    }
  });
}

// Handle user's response
bot.on('callback_query', async (query) => {
  const [action, persona] = query.data.split(':');

  if (action === 'override') {
    // Send override back to M1
    await fetch('http://localhost:5000/override', {
      method: 'POST',
      body: JSON.stringify({ persona })
    });
    await bot.answerCallbackQuery(query.id, { text: `✅ Switching to ${persona}` });
  }
});
```

### Conflict threshold (for M1 team reference):

```javascript
// In conflictResolver.js — a conflict is raised if top two scores are within 5%
const CONFLICT_THRESHOLD = 0.05;
const topTwo = sortedCandidates.slice(0, 2);
const scoreDiff = Math.abs(topTwo[0].adjustedScore - topTwo[1].adjustedScore);
if (scoreDiff < CONFLICT_THRESHOLD) {
  return { requires_user_input: true, conflict: { ... } };
}
```

---

## 6. State Management

M1 tracks full engine state so M4 can display it and M3 can timestamp queries. Here is the complete live state object:

```json
{
  "currentPersona": "work",
  "previousPersona": "calm",
  "lastSwitchTime": "2026-05-05T09:45:00.000Z",
  "inCooldown": false,
  "cooldownRemainingCycles": 0,
  "modeDurationMinutes": 12,
  "decisionCount": 47,
  "cycleCount": 89,
  "uptime": "1h 29m 10s",
  "errors": 0,
  "isRunning": true,
  "features": {
    "predictiveIntelligence": true,
    "confidenceSystem": true,
    "transitionEngine": true,
    "llmEnabled": false
  }
}
```

### How to query state

```bash
node index.js status
```

Or from another module:
```javascript
const { getHeartbeatStatus } = require('./heartbeat');
const state = getHeartbeatStatus();
console.log(state.currentPersona);   // "work"
console.log(state.inCooldown);       // false
```

### Cooldown Periods (Anti-Thrash)

The engine enforces minimum cycles before leaving certain modes:

| Persona | Cooldown Cycles | Why |
|---------|----------------|-----|
| `sleep` | 3 cycles | Don't wake up instantly |
| `fitness` | 2 cycles | Give workout time to start |
| `calm` | 2 cycles | Prevent stress bounce |
| All others | 0 cycles | Instant switch OK |

At 10s per cycle: sleep cooldown = ~30 seconds minimum.

---

## 7. Failsafe / Fallback System

The engine is hardened against failures. Here is the full fallback chain:

```
Context read fails?        → Use last valid context
                           → If none, use hardcoded defaults

LLM/OpenAI fails?          → Skip AI layer entirely
                           → Use rule-based candidates only

No candidates generated?   → Return "default" persona (score 0.50)

Transition step fails?     → Log warning, skip to next step
                           → Never block persona activation

Execution fails?           → Log error, increment error counter
                           → Heartbeat continues on next cycle

context.json missing?      → Load these defaults automatically:
```

```javascript
// Default fallback context (in contextReader.js)
const DEFAULT_CONTEXT = {
  location: "home",
  calendar_event: "none",
  upcoming_event: null,
  time_to_event: null,
  stress: 0.3,
  battery: 85,
  notifications: 2,
  activity: "idle"
};
```

**What judges will see:** "Even when sensors fail, the system defaults gracefully and keeps running."

---

## 8. API Wrapper — Plug & Play Interface

All three modules (M2, M3, M4) should interact with M1 through this clean API, not by importing internals.

### GET: Current decision

```javascript
// Any module calls this to get the latest decision
const { getDecision } = require('./apiWrapper');

const decision = await getDecision(contextData);
// Returns the full standardized output contract (Section 2)
```

### POST: Context update (from M3)

```javascript
const { updateContext } = require('./apiWrapper');
await updateContext({
  location: "gym",
  stress: 0.2,
  battery: 78,
  // ...
});
```

### POST: Manual persona override (from M4)

```javascript
const { overridePersona } = require('./apiWrapper');
await overridePersona("calm"); // User pressed "Calm" on Telegram
```

### GET: Current state (for M4 dashboard)

```javascript
const { getState } = require('./apiWrapper');
const state = getState();
// Returns Section 6 state object
```

> 📌 The `apiWrapper.js` file is on the M1 backlog. The exact HTTP routes will be:
> - `GET  /decision` → run a cycle and return output
> - `POST /context`  → update context from M3
> - `POST /override` → user override from M4
> - `GET  /state`    → current engine state

---

## 9. Real-Time Event Hooks

The heartbeat polls every 10 seconds. But some events need an **instant response**. Here is the event hook system that can be called from outside the cycle:

```javascript
// Any module can trigger these directly
const { triggerEvent } = require('./heartbeat');

// M3 detected a new calendar event
triggerEvent('onCalendarEvent', {
  event: 'Emergency Meeting',
  time_to_event: 3
});

// M3 detected location change
triggerEvent('onLocationChange', {
  from: 'home',
  to: 'office'
});

// Wearable sensor spiked
triggerEvent('onStressSpike', {
  stress: 0.88
});

// Battery dropped critically
triggerEvent('onBatteryCritical', {
  battery: 12
});
```

These bypass the 10-second interval and force an immediate decision cycle.

> ⚠️ Currently these hooks are not yet implemented in the engine. M1 will add them after the API wrapper. For now, update `context.json` directly and the next heartbeat cycle (within 10s) will pick it up.

---

## 10. Persona Override Support

A user should always be able to manually override the AI. Here is how the flow works:

```
User taps "Override → Calm" in Telegram
   ↓
M4 sends POST /override { persona: "calm" }
   ↓
M1 sets override flag in state
   ↓
Next heartbeat cycle detects override
   ↓
Override persona wins regardless of signals
   ↓
Override clears after 2 cycles (or next natural transition)
```

```javascript
// In state.json — override tracking
{
  "manualOverride": {
    "active": true,
    "persona": "calm",
    "setAt": "2026-05-05T14:00:00Z",
    "expiresAfterCycles": 2
  }
}
```

**For demo:** If a judge asks "can the user control it?" — M4 taps a button in Telegram, the persona switches instantly. That's the answer.

---

## 11. Who Changes What File

| File | Owner | Do others touch it? |
|------|-------|---------------------|
| `contextReader.js` | M1 + M3 | M3 replaces the `readContext()` function |
| `executor.js` | M1 + M2 + M4 | M2 replaces `executeBehaviors()`, M4 replaces `notifyUser()` |
| `decisionEngine.js` | M1 **only** | No one else touches this |
| `heartbeat.js` | M1 **only** | No one else touches this |
| `conflictResolver.js` | M1 **only** | No one else touches this |
| `personaManager.js` | M1 **only** | No one else touches this |
| `context.json` | M3 writes | M1 reads. M3 overwrites every cycle. |
| `.env` | Everyone fills their own key | Use the table in Section 1 |
| `apiWrapper.js` | M1 builds | M2, M3, M4 read |

### The 2 files M2/M3/M4 will edit

#### `contextReader.js` — M3 Integration Point

```javascript
// BEFORE (mock) — reads from file
function readContext() {
  return JSON.parse(fs.readFileSync('./context.json'));
}

// AFTER (M3 integrated) — fetches from M3 API
async function readContext() {
  try {
    const response = await axios.get(process.env.M3_API_URL + '/context', {
      headers: { Authorization: `Bearer ${process.env.M3_API_TOKEN}` }
    });
    return response.data;
  } catch (err) {
    console.warn('M3 unavailable, using cached context');
    return readContextFromFile(); // fallback
  }
}
```

#### `executor.js` — M2 + M4 Integration Point

```javascript
// BEFORE (mock)
async function executeBehaviors(persona, behaviors) {
  behaviors.forEach(b => console.log(`executing: ${b}`));
}

// AFTER (M2 integrated)
async function executeBehaviors(persona, behaviors) {
  // Get the actions from the decision output
  const actions = PERSONA_ACTIONS[persona] || [];
  await m2.executeActions(actions); // M2 module call
}

// BEFORE (mock notification)
async function notifyUser(persona, message) {
  console.log(`NOTIFICATION: ${message}`);
}

// AFTER (M4 integrated)
async function notifyUser(persona, message) {
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `✅ ${persona}: ${message}`);
}
```

---

## 12. Integration Checklist

Use this to track integration progress as a team.

### M3 → M1 Integration
- [ ] M3 context format matches Section 3 schema
- [ ] `M3_API_URL` and `M3_API_TOKEN` filled in `.env`
- [ ] M3 team tested: `curl http://m3-host/context` returns valid JSON
- [ ] `contextReader.js` updated to call M3 API
- [ ] Fallback to `context.json` works when M3 is offline
- [ ] End-to-end test: context flows from M3 → decision engine → output

### M2 ← M1 Integration
- [ ] M2 reads `actions` array from M1 output (Section 2)
- [ ] All actions in Section 4 mapped to ADB commands
- [ ] `executor.js` updated to call M2 `executeActions()`
- [ ] ADB device connected and verified: `adb devices`
- [ ] End-to-end test: `work` persona → `enable_dnd` fires on device

### M4 ← M1 Integration  
- [ ] `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` filled in `.env`
- [ ] M4 bot is running and responding to messages
- [ ] `executor.js` `notifyUser()` updated to call Telegram
- [ ] Conflict keyboard working (Section 5)
- [ ] Override command wired to `/override` endpoint
- [ ] End-to-end test: persona switch → Telegram message received

### Full System Test
- [ ] Run `npm run demo` — all 9 scenes pass
- [ ] M3 sends live context → engine decides → M2 executes → M4 notifies
- [ ] Conflict raised → user gets Telegram buttons → picks option → engine switches
- [ ] Predictive switch fires 15 min before a real calendar event
- [ ] Engine runs for 10+ minutes without errors in memory log

---

## 🆘 Quick Help

```bash
# Start the engine
node index.js start

# Run the full demo (no real sensors needed)
npm run demo

# Run fast demo (2s between scenes)
npm run demo:fast

# Check status
node index.js status

# View memory log
node index.js memory

# List all personas
node index.js personas

# Run automated tests
node index.js test
```

**Questions?** Ask the M1 team (Pi Engine) before touching any file.

---

*Last updated: v2.0 — covers Predictive Intelligence, Confidence System, Transition Engine, Explainability, Demo Mode.*
