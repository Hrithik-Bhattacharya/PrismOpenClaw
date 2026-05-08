from twilio.rest import Client
import os
from dotenv import dotenv_values

env_vars = dotenv_values('.env')
account_sid = env_vars.get('TWILIO_ACCOUNT_SID')
auth_token = env_vars.get('TWILIO_AUTH_TOKEN')
from_num = env_vars.get('TWILIO_FROM_NUMBER')
to_num = env_vars.get('WHATSAPP_TO_NUMBER')

print(f"Loaded SID: {account_sid}")

if account_sid:
    client = Client(account_sid, auth_token)
    try:
        message = client.messages.create(
            from_=from_num,
            body='Test from open_claw',
            to=to_num
        )
        print("Success! SID:", message.sid)
        print("Status:", message.status)
        print("Error code:", message.error_code)
        print("Error message:", message.error_message)
    except Exception as e:
        print("Exception:", e)
