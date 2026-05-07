"""
Demo utilities — simulate M1/M3 payloads against the local M4 server.
Usage:  python tests/payloads.py [scenario]
Scenarios: conflict | stress | brief | suggestion | decision | all
"""

import sys
import httpx

BASE = "http://localhost:8000"

# Load token from env so this script is also token-safe
import os
from dotenv import load_dotenv
load_dotenv()
TOKEN = os.environ["M3_API_TOKEN"]
HEADERS = {"x-api-token": TOKEN}


SAMPLES = {
    "conflict": {
        "url": f"{BASE}/conflict",
        "payload": {"persona_a": "WORK", "persona_b": "GYM"},
    },
    "stress": {
        "url": f"{BASE}/stress-alert",
        "payload": {"stress_level": 0.82, "reason": "Dense calendar + 3 unanswered messages"},
    },
    "brief": {
        "url": f"{BASE}/morning-brief",
        "payload": {
            "personas": [
                {"time": "08:00", "persona": "WORK",       "conflict": False},
                {"time": "12:30", "persona": "GYM",        "conflict": False},
                {"time": "15:00", "persona": "INTERVIEW",  "conflict": True},
                {"time": "19:00", "persona": "HOME",       "conflict": False},
            ]
        },
    },
    "suggestion": {
        "url": f"{BASE}/persona-suggestion",
        "payload": {
            "suggested_persona": "DEEP_WORK",
            "reason": "You have a 3-hour gap with no calendar events — historically your focus peak.",
        },
    },
    "decision": {
        "url": f"{BASE}/decision",
        "payload": {
            "persona": "CALM",
            "reason": "Heart rate variability dropped below baseline during focus block.",
            "explanation": {
                "full_report": "The AI detected a stress signature. Context engine combined Calendar density (High) and biometric feedback (HRV Drop) to confidently suggest an immediate override to Calm Mode to prevent burnout."
            },
            "requires_user_input": True,
            "conflict": False,
            "extra_massive_json_field_1": "ignored",
            "extra_massive_json_field_2": [1, 2, 3]
        },
    },
}


def run(scenario: str):
    cfg = SAMPLES[scenario]
    print(f"-> POST {cfg['url']}")
    r = httpx.post(cfg["url"], json=cfg["payload"], headers=HEADERS, timeout=10)
    print(f"  {r.status_code} {r.text}\n")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target == "all":
        for name in SAMPLES:
            run(name)
    elif target in SAMPLES:
        run(target)
    else:
        print(f"Unknown scenario '{target}'. Choose: {list(SAMPLES)}")
