import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "tasknotes")

_client = AsyncIOMotorClient(MONGODB_URL)
_db = _client[MONGODB_DB]

# Dependency
async def get_collection(name: str):
    return _db[name]