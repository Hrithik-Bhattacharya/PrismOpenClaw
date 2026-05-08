# 🔄 Team Execution Flow & Work Plan

This document outlines exactly how the modules interact end-to-end, what each team member must build next, and our testing/integration strategy.

---

## 1. END-TO-END EXECUTION FLOW (DETAILED)

### 🟢 FLOW A — NORMAL OPERATION

**Step 1 — Context Update (M3)**
- Reads: GPS, Calendar, WiFi, Stress
- Sends → M1:
  ```json
  { "location": "office", "time_to_event": 20 }
  ```

**Step 2 — Decision Cycle (M1)**
- Runs: `confidenceEngine`, predictive logic, `decisionEngine`, `conflictResolver`, `transitionEngine`, `explainEngine`
- Outputs:
  ```json
  { "persona": "work", "actions": ["enable_dnd"], "reason": "Meeting in 20 min" }
  ```

**Step 3 — Execution (M2)**
- Converts: `"enable_dnd"` → ADB command

**Step 4 — UX Feedback (M4)**
- Sends: "Switched to Work Mode" + Explanation

**Step 5 — Memory Update (M1)**
- Logs decision, updates state

### 🔴 FLOW B — CONFLICT HANDLING

**Step 1 — M1 detects conflict**
```json
{ "requires_user_input": true, "conflict": ["gym", "meeting"] }
```

**Step 2 — M4 handles UI**
- Telegram buttons: "Gym" / "Meeting"

**Step 3 — User selects** (e.g., Gym)

**Step 4 — M4 → M1**
```json
{ "override": "gym" }
```

**Step 5 — M1 applies override**
- Bypasses decision engine, triggers execution immediately.

### 🔵 FLOW C — PREDICTIVE MODE

**Step 1 — M3 sends:**
```json
{ "upcoming_event": "meeting", "time_to_event": 15 }
```

**Step 2 — M1:**
- Triggers pre-switch based on `time_to_event`.

**Step 3 — M2:**
- Prepares device (e.g., reduces notifications).

**Step 4 — M4:**
- Informs user ("Preparing for upcoming meeting").

---

## 2. TEAM WORK PLAN (WHAT EACH MEMBER DOES NEXT)

### 🧠 M1 (Brain) — FINAL OWNER
**Goals:**
- Expose API (`getDecision`).
- Stabilize JSON output.
- Handle override endpoint.
- Finalize logging format.

### 📱 M2 — ANDROID / ADB
**Goal:** "Convert actions → real device changes"
**Tasks:**
1. **Build Executor Service:** Accept `{"actions": ["enable_dnd", "open_calendar"]}`.
2. **Map Actions → ADB:**
   - `enable_dnd` → `cmd notification set_dnd on`
   - `open_calendar` → `am start -n com.calendar`
3. **Build Listener:** HTTP endpoint, WebSocket, or CLI trigger.
4. **Handle Failures:** Retry logic, error logging.
> ⚠️ **Rules:** ❌ DO NOT add logic ❌ DO NOT modify persona

### 📡 M3 — CONTEXT ENGINE
**Goal:** "Send accurate, reliable real-world data"
**Tasks:**
1. **Build Data Collectors:** GPS, Calendar API, WiFi detection, Battery, Stress (optional).
2. **Normalize Data:** Must match M1 contract exactly.
3. **Send to M1:** HTTP POST, File write, or WebSocket.
4. **Add Confidence Scores.**
> ⚠️ **Rules:** ❌ DO NOT decide persona ❌ DO NOT interpret

### 💬 M4 — TELEGRAM + UX
**Goal:** "Make system understandable & interactive"
**Tasks:**
1. **Build Telegram Bot:** BotFather setup, webhook/polling.
2. **Parse M1 Output:** Use `reason`, `explanation`, `conflict`.
3. **Conflict UI:** Create Telegram inline buttons for competing personas.
4. **Send Override:** Post `{"override": "work"}` back to M1.
5. **Notification System:** Example messages like "Entering Work Mode", "Preparing for meeting".
> ⚠️ **Rules:** ❌ DO NOT create decisions ❌ DO NOT override without user

---

## 3. INTEGRATION PLAN (CRITICAL)

- **🟢 Phase 1 — M3 → M1:** Real context replaces mock data; test decision output.
- **🟢 Phase 2 — M1 → M2:** Actions are successfully executed on device.
- **🟢 Phase 3 — M1 → M4:** Telegram notifications fire on persona changes.
- **🟢 Phase 4 — FULL LOOP:** Conflict → User Override → Execution across all modules.

---

## 4. TESTING PLAN

### Unit Testing
- **M1:** Done (100% pass).
- **M2:** Command execution verification.
- **M3:** Data validity and schema compliance.

### Integration Testing
- **Scenario 1:** Meeting detected → Work mode triggered.
- **Scenario 2:** Gym + Meeting conflict → User selects via Telegram → System obeys.
- **Scenario 3:** Low battery → Power saver mode overrides everything.
