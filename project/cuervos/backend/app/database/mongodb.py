"""
Gestión de conexión a MongoDB usando Motor (asyncio).

Se expone una instancia global `mongodb` con métodos:
- connect(): abre el cliente y selecciona la base de datos
- disconnect(): cierra el cliente
- get_collection(name): retorna una colección para operar (CRUD)

Uso típico en routers:
    collection = get_collection("notes")
    await collection.insert_one({...})
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


class MongoDBManager:
    def __init__(self):
        self.client = None
        self.database = None
    
    async def connect(self):
        self.client = AsyncIOMotorClient(settings.mongodb_url)
        self.database = self.client[settings.mongodb_db_name]
        print("Connected to MongoDB")
    
    async def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")
    
    def get_collection(self, collection_name: str):
        return self.database[collection_name]


# Global instance
mongodb = MongoDBManager()


def get_collection(collection_name: str):
    """Helper para obtener una colección por nombre."""
    return mongodb.get_collection(collection_name)