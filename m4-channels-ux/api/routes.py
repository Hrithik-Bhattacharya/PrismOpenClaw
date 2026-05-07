"""
FastAPI routes — entry points for M1 (conflict/suggestion) and M3 (stress).
All routes require the M3_API_TOKEN header for authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from config import M3_API_TOKEN
from handlers.telegram_bot import (
    send_conflict_message,
    send_calm_alert,
    send_persona_suggestion,
    send_decision_message,
)
from handlers.whatsapp_bot import send_whatsapp_morning_brief

router = APIRouter()


# ── Auth dependency ───────────────────────────────────────────────────────────

async def verify_token(x_api_token: str = Header(...)):
    if x_api_token != M3_API_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Request schemas ───────────────────────────────────────────────────────────

class ConflictRequest(BaseModel):
    persona_a: str
    persona_b: str

class StressRequest(BaseModel):
    stress_level: float   # 0.0–1.0
    reason: str

class MorningBriefRequest(BaseModel):
    # Each item: { "time": "09:00", "persona": "WORK", "conflict": false }
    personas: list[dict]

class SuggestionRequest(BaseModel):
    suggested_persona: str
    reason: str

class Explanation(BaseModel):
    full_report: str

class DecisionRequest(BaseModel):
    persona: str
    reason: str = ""
    explanation: Explanation | None = None
    requires_user_input: bool = False
    conflict: bool = False
    
    class Config:
        extra = 'allow'


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/conflict", dependencies=[Depends(verify_token)])
async def conflict(req: ConflictRequest):
    """M1 calls this when two personas are active simultaneously."""
    await send_conflict_message(req.persona_a, req.persona_b)
    return {"status": "sent"}


@router.post("/stress-alert", dependencies=[Depends(verify_token)])
async def stress_alert(req: StressRequest):
    """M3 calls this when stress signals exceed threshold."""
    await send_calm_alert(req.stress_level, req.reason)
    return {"status": "sent"}


@router.post("/morning-brief", dependencies=[Depends(verify_token)])
async def morning_brief(req: MorningBriefRequest):
    """Scheduled job or M1 calls this at morning trigger time."""
    send_whatsapp_morning_brief(req.personas)
    return {"status": "sent"}


@router.post("/persona-suggestion", dependencies=[Depends(verify_token)])
async def persona_suggestion(req: SuggestionRequest):
    """M1 calls this after Claude API produces a persona recommendation."""
    await send_persona_suggestion(req.suggested_persona, req.reason)
    return {"status": "sent"}


@router.post("/decision", dependencies=[Depends(verify_token)])
async def decision(req: DecisionRequest):
    """M1 calls this with the massive JSON object containing the AI report."""
    await send_decision_message(req.dict())
    return {"status": "sent"}


@router.get("/health")
async def health():
    return {"status": "ok"}
