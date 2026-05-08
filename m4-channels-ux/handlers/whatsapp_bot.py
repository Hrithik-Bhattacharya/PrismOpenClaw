from twilio.rest import Client
import os
from config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    WHATSAPP_TO_NUMBER,
)


def _get_client():
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return None
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_whatsapp_morning_brief(personas: list[dict]) -> None:
    """Send daily morning summary of predicted persona schedule via WhatsApp."""
    client = _get_client()
    if client is None:
        print("⚠️ Twilio credentials missing in .env. Skipping WhatsApp message.")
        return

    try:
        lines = ["🌅 *Daily Neural Briefing*\n━━━━━━━━━━━━━━━━━━"]
        for p in personas:
            conflict = " ⚠️ _Collision Risk_" if p.get("conflict") else ""
            lines.append(f"🕰️ {p['time']} ➡️ *{p['persona']}*{conflict}")
        
        if not personas:
            lines.append("  _No automated switches scheduled today._")
            
        message_body = "\n".join(lines)
        
        message = client.messages.create(
            from_=TWILIO_FROM_NUMBER,
            body=message_body,
            to=WHATSAPP_TO_NUMBER
        )
        print(f"✅ WhatsApp morning brief sent successfully. SID: {message.sid}")
    except Exception as e:
        print(f"❌ Failed to send WhatsApp message: {e}")


def send_whatsapp_decision_update(decision_data: dict) -> None:
    """Send latest persona decision + reason + short explainability to WhatsApp."""
    client = _get_client()
    if client is None:
        print("⚠️ Twilio credentials missing in .env. Skipping WhatsApp decision message.")
        return

    try:
        persona = decision_data.get("persona") or "UNKNOWN"
        reason = decision_data.get("reason") or "No reason provided."
        explanation = (decision_data.get("explanation") or {}).get("full_report") or "No report provided."

        # Keep WhatsApp message concise; avoid sending giant payload blocks
        short_explanation = explanation.strip().replace("\n", " ")
        if len(short_explanation) > 450:
            short_explanation = short_explanation[:450] + "..."

        body = (
            "✨ *Persona Transition Initiated*\n"
            "━━━━━━━━━━━━━━━━━━\n"
            f"🎯 *Target Mode:* {persona}\n"
            f"⚡ *Trigger:* {reason}\n"
            f"🧠 *Explainability:* {short_explanation}"
        )

        message = client.messages.create(
            from_=TWILIO_FROM_NUMBER,
            body=body,
            to=WHATSAPP_TO_NUMBER,
        )
        print(f"✅ WhatsApp decision update sent successfully. SID: {message.sid}")
    except Exception as e:
        print(f"❌ Failed to send WhatsApp decision update: {e}")
