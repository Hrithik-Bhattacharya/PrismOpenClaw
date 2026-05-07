"""
Phantom Mode — M4 Communication Layer
Starts FastAPI server, Telegram polling, and morning-brief scheduler.
"""

import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI

from api.routes import router
from handlers.telegram_bot import get_app
from utils.scheduler import start_scheduler
from config import HOST, PORT


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Telegram polling in background
    tg_app = get_app()
    await tg_app.initialize()
    await tg_app.start()
    asyncio.create_task(tg_app.updater.start_polling(drop_pending_updates=True))

    # Start morning-brief cron
    start_scheduler()

    yield

    # Graceful shutdown
    await tg_app.updater.stop()
    await tg_app.stop()
    await tg_app.shutdown()


app = FastAPI(title="Phantom M4 — Comms Layer", lifespan=lifespan)
app.include_router(router)


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
