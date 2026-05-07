from twilio.rest import Client
import os
from config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    WHATSAPP_TO_NUMBER,
)

def send_whatsapp_morning_brief(personas: list[dict]) -> None:
    """Send daily morning summary of predicted persona schedule via WhatsApp."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print("⚠️ Twilio credentials missing in .env. Skipping WhatsApp message.")
        return

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
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
