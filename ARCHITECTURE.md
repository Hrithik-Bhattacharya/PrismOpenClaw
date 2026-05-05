# 🏗️ PrismOpenClaw Architecture

This document defines the **Official System Architecture** for PrismOpenClaw.

## 🔥 HIGH-LEVEL FLOW

```text
  [M3: Context Engine]
          ↓
     (context JSON)
          ↓
[M1: PI Engine - Brain]
          ↓
   (decision JSON)
     ↙          ↘
[M2: ADB]     [M4: Telegram UX]
(Device)         (User)
    ↓              ↑
 Execution    User Override
    ↓              ↑
    └──────→ M1 State ←──────┘
```

## 🧠 CORE PRINCIPLE

**M1 = Brain (Single Source of Truth)**
No one else makes decisions. The system operates as one cohesive product driven entirely by M1.

## 📦 MODULE RESPONSIBILITIES

| Module | Responsibility | NEVER DO |
|--------|----------------|----------|
| **M1 (PI Engine)** | Decision, prediction, reasoning | No direct device control |
| **M2 (ADB)** | Execute actions | No decision logic |
| **M3 (Context Engine)** | Provide accurate context | No persona decisions |
| **M4 (Telegram UX)** | Communicate with user, handle overrides | No autonomous decisions |

---
*For the detailed step-by-step execution flows, see [TEAM_FLOW.md](./TEAM_FLOW.md).*
