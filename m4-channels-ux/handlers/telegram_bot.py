"""Telegram bot — sends messages and processes inline button callbacks."""

from datetime import datetime, timezone
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CallbackQueryHandler, ContextTypes
import httpx

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, M1_CALLBACK_URL
from handlers.channel_adapter import normalise_response

import html

bot = Bot(token=TELEGRAM_BOT_TOKEN)
_app: Application | None = None


def get_app() -> Application:
    global _app
    if _app is None:
        _app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        _app.add_handler(CallbackQueryHandler(handle_callback))
    return _app


# ── Outbound helpers ──────────────────────────────────────────────────────────

async def send_conflict_message(persona_a: str, persona_b: str) -> None:
    """Send conflict alert with three inline choice buttons."""
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(f"🛡️ {persona_a}", callback_data=f"persona:{persona_a}"),
            InlineKeyboardButton(f"🛡️ {persona_b}", callback_data=f"persona:{persona_b}"),
        ],
        [InlineKeyboardButton("💤 Snooze Automations", callback_data="persona:PAUSE")],
    ])
    await bot.send_message(
        chat_id=TELEGRAM_CHAT_ID,
        text=(
            f"⚠️ <b>Context Collision Detected</b> ⚠️\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"Two environmental contexts are fighting for control:\n\n"
            f"🔹 <code>{html.escape(persona_a)}</code>\n"
            f"🔹 <code>{html.escape(persona_b)}</code>\n\n"
            f"<i>Which neural profile should take priority?</i>"
        ),
        parse_mode="HTML",
        reply_markup=keyboard,
    )


async def send_morning_brief(personas: list[dict]) -> None:
    """Send daily morning summary of predicted persona schedule."""
    lines = ["🌅 <b>Daily Neural Briefing</b>\n━━━━━━━━━━━━━━━━━━"]
    for p in personas:
        conflict = " ⚠️ <i>Collision Risk</i>" if p.get("conflict") else ""
        lines.append(f"🕰️ <code>{html.escape(p['time'])}</code> ➡️ <b>{html.escape(p['persona'])}</b>{conflict}")
    if not personas:
        lines.append("  <i>No automated switches scheduled today.</i>")
    await bot.send_message(
        chat_id=TELEGRAM_CHAT_ID,
        text="\n".join(lines),
        parse_mode="HTML",
    )


async def send_calm_alert(stress_level: float, reason: str) -> None:
    """Notify user when M3 detects stress."""
    await bot.send_message(
        chat_id=TELEGRAM_CHAT_ID,
        text=(
            f"🧘‍♀️ <b>Biometric Alert: High Stress</b>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📊 <b>Stress Level:</b> <code>{stress_level:.0%}</code>\n"
            f"🔍 <b>Detected Cause:</b> <i>{html.escape(reason)}</i>\n\n"
            f"<i>Executing emergency override to Calm Mode…</i>"
        ),
        parse_mode="HTML",
    )


async def send_persona_suggestion(suggested: str, reason: str) -> None:
    """AI-generated persona suggestion with accept/edit options."""
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Engage", callback_data=f"persona:{suggested}"),
        InlineKeyboardButton("✏️ Tweak", callback_data="persona:EDIT"),
    ]])
    await bot.send_message(
        chat_id=TELEGRAM_CHAT_ID,
        text=(
            f"🤖 <b>Proactive Persona Suggestion</b>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🎯 <b>Recommended:</b> <code>{html.escape(suggested)}</code>\n\n"
            f"🧠 <b>Reasoning:</b>\n"
            f"<blockquote><i>{html.escape(reason)}</i></blockquote>"
        ),
        parse_mode="HTML",
        reply_markup=keyboard,
    )


async def send_decision_message(decision_data: dict) -> None:
    """Send explainable AI decision with optional override buttons."""
    persona = decision_data.get("persona", "UNKNOWN")
    reason = decision_data.get("reason", "No reason provided.")
    explanation = decision_data.get("explanation") or {}
    report = explanation.get("full_report", "No detailed report available.")
    
    # Alignment/readability fix:
    # Render report in monospace block so table-like sections stay aligned better.
    # Length guard is recommended for Telegram reliability (message size limits),
    # but can be disabled by setting to None.
    TELEGRAM_REPORT_MAX_CHARS = 2800

    rendered_report = report
    if TELEGRAM_REPORT_MAX_CHARS is not None and len(rendered_report) > TELEGRAM_REPORT_MAX_CHARS:
        rendered_report = rendered_report[:TELEGRAM_REPORT_MAX_CHARS] + "\n... [report truncated]"

    text = (
        f"✨ <b>Persona Transition Initiated</b> ✨\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🎯 <b>Target Mode:</b> <code>{html.escape(persona)}</code>\n"
        f"⚡ <b>Trigger:</b> <i>{html.escape(reason)}</i>\n\n"
        f"🧠 <b>Neural Explanation Report:</b>\n"
        f"<blockquote expandable><tg-spoiler><pre>{html.escape(rendered_report)}</pre></tg-spoiler></blockquote>"
    )
    
    keyboard = None
    if decision_data.get("conflict") or decision_data.get("requires_user_input"):
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(f"🛡️ Engage {persona} Mode", callback_data=f"persona:{persona}")],
            [InlineKeyboardButton("🕹️ Manual Override", callback_data="persona:REJECT")],
            [InlineKeyboardButton("💤 Snooze Automations", callback_data="persona:PAUSE")],
        ])
        
    await bot.send_message(
        chat_id=TELEGRAM_CHAT_ID,
        text=text,
        parse_mode="HTML",
        reply_markup=keyboard,
    )


# ── Callback handler ──────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline button presses → normalise → forward to M1."""
    query = update.callback_query
    await query.answer()

    raw = query.data  # e.g. "persona:WORK" or "persona:PAUSE"
    _, value = raw.split(":", 1)

    if value == "EDIT":
        original_text = query.message.text_html if query.message.text_html else ""
        label = "✏️ <b>Edit requested.</b>"
        new_text = label if not original_text else f"{original_text}\n\n──────────────\n{label}"
        await query.edit_message_text(text=new_text, parse_mode="HTML")
        return

    payload = normalise_response(value)

    # Forward decision to M1 (fire-and-forget; M1 may be temporarily down)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(M1_CALLBACK_URL, json=payload)
    except Exception:
        pass  # M1 will poll state on next heartbeat cycle

    label = "😴 <b>Sleep mode enabled.</b>" if value == "PAUSE" else f"✅ <b>Persona {html.escape(value)} selected.</b>"
    
    # Preserve the original text (including spoilers) and append the result
    original_text = query.message.text_html if query.message.text_html else ""
    if not original_text:
        new_text = label
    else:
        new_text = f"{original_text}\n\n──────────────\n{label}"

    await query.edit_message_text(text=new_text, parse_mode="HTML")
