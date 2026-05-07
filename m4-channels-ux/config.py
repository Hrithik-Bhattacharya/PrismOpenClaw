import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID   = os.environ["TELEGRAM_CHAT_ID"]
M3_API_TOKEN       = os.environ["M3_API_TOKEN"]
M1_CALLBACK_URL    = os.getenv("M1_CALLBACK_URL", "http://localhost:8001/persona-decision")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
WHATSAPP_TO_NUMBER = os.getenv("WHATSAPP_TO_NUMBER", "")

HOST               = os.getenv("HOST", "0.0.0.0")
PORT               = int(os.getenv("PORT", 8000))
