"""Scheduler — fires morning brief daily at 07:00 local time."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from handlers.whatsapp_bot import send_whatsapp_morning_brief

scheduler = AsyncIOScheduler()


def start_scheduler():
    # Placeholder personas; in production M1 pushes these via /morning-brief
    async def _send():
        send_whatsapp_morning_brief([])  # empty triggers "no switches today" msg

    scheduler.add_job(_send, "cron", hour=7, minute=0, id="morning_brief")
    scheduler.start()
