import asyncio
import httpx
from fastapi.testclient import TestClient
from main import app
from config import M3_API_TOKEN

client = TestClient(app)

def run_tests():
    headers = {"x-api-token": M3_API_TOKEN}
    payload = {"persona_a": "WORK", "persona_b": "GYM"}
    try:
        response = client.post("/conflict", json=payload, headers=headers)
        print("Status:", response.status_code)
        print("Response:", response.text)
    except Exception as e:
        print("Exception occurred:", type(e).__name__, e)

if __name__ == "__main__":
    run_tests()
