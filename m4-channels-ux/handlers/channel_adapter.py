"""Channel adapter — converts raw Telegram choices into M1-compatible JSON."""

from datetime import datetime, timezone


def normalise_response(selected_value: str) -> dict:
    """
    Convert a Telegram button value into the structured format M1 expects.

    selected_value: persona name string, or "PAUSE" / "EDIT"
    """
    persona = "sleep" if selected_value == "PAUSE" else selected_value

    return {
        "persona": persona,
        "selected_persona": selected_value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "telegram",
    }
