# services/gamification-service/app/db/session.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# --- Lógica de conexión a MongoDB ---
client = AsyncIOMotorClient(DATABASE_URL)

# Función para obtener la base de datos en los endpoints
# Ya no se llama a get_database() directamente aquí
async def get_database():
    # El nombre de la base de datos se infiere de la DATABASE_URL
    return client.get_database()