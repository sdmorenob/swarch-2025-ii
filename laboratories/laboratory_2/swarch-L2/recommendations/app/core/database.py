import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_USERNAME = os.getenv("MONGO_USERNAME", "app")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "123")
MONGO_HOSTNAME = os.getenv("MONGO_HOSTNAME", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
MONGO_DB = os.getenv("MONGO_DB", "recommendations_db")

MONGO_URL = f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_HOSTNAME}:{MONGO_PORT}"

client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB]

recommendations_col = db["recommendations"]

async def ping():
    await db.command("ping")
