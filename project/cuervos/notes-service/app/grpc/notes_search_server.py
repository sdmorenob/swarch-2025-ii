import asyncio
import grpc
from concurrent import futures
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database.mongodb import get_collection
from app.database.postgres import get_db
from app.services.expand import expand_category, expand_tags
from app.grpc.generated import notes_search_pb2, notes_search_pb2_grpc, common_pb2


class NotesSearchServicer(notes_search_pb2_grpc.NotesSearchServiceServicer):
    """Implementación del servicio gRPC para búsqueda de notas"""
    
    async def SearchNotes(self, request, context):
        """Busca notas basado en los criterios proporcionados"""
        try:
            # Validaciones
            if len(request.query) > 1000:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Query too long")
                return notes_search_pb2.SearchNotesResponse()
            
            if request.limit <= 0:
                limit = 20
            elif request.limit > 100:
                limit = 100
            else:
                limit = request.limit
            
            skip = max(0, request.skip)
            
            # Obtener conexiones
            collection = await get_collection("notes")
            db_gen = get_db()
            db = next(db_gen)
            
            try:
                # Construir query de MongoDB
                query = {"user_id": request.user_id}
                
                # Búsqueda de texto
                if len(request.query) >= 3:
                    # Usar índice de texto completo
                    query["$text"] = {"$search": request.query}
                else:
                    # Fallback a regex para queries cortas
                    query["$or"] = [
                        {"title": {"$regex": request.query, "$options": "i"}},
                        {"content": {"$regex": request.query, "$options": "i"}},
                    ]
                
                # Filtros opcionales
                if request.category:
                    if len(request.category) > 100:
                        context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                        context.set_details("Category name too long")
                        return notes_search_pb2.SearchNotesResponse()
                    query["category"] = request.category
                
                if request.tags:
                    if len(request.tags) > 20:
                        context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                        context.set_details("Too many tags")
                        return notes_search_pb2.SearchNotesResponse()
                    
                    # Validar longitud de tags
                    for tag in request.tags:
                        if len(tag) > 50:
                            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                            context.set_details("Tag name too long")
                            return notes_search_pb2.SearchNotesResponse()
                    
                    query["tags"] = {"$in": list(request.tags)}
                
                # Contar total
                total = await collection.count_documents(query)
                
                # Ejecutar búsqueda con paginación
                cursor = collection.find(query).skip(skip).limit(limit)
                
                # Ordenamiento
                if len(request.query) >= 3 and "$text" in query:
                    cursor = cursor.sort([
                        ("score", {"$meta": "textScore"}),
                        ("updated_at", -1)
                    ])
                else:
                    cursor = cursor.sort("updated_at", -1)
                
                notes = await cursor.to_list(length=limit)
                
                # Convertir a formato gRPC
                search_results = []
                for note in notes:
                    # Expandir categoría y tags
                    category = None
                    if note.get("category_id"):
                        cat_data = expand_category(note.get("category_id"), db)
                        if cat_data:
                            category = common_pb2.CategorySummary(
                                id=str(cat_data["id"]),
                                name=cat_data["name"],
                                color=cat_data.get("color", "")
                            )
                    
                    tags = []
                    if note.get("tag_ids"):
                        tags_data = expand_tags(note.get("tag_ids", []), db)
                        for tag_data in tags_data:
                            tags.append(common_pb2.TagSummary(
                                id=str(tag_data["id"]),
                                name=tag_data["name"],
                                color=tag_data.get("color", "")
                            ))
                    
                    # Crear resultado
                    result = notes_search_pb2.NoteSearchResult(
                        id=str(note.get("_id")),
                        title=note.get("title", ""),
                        content=note.get("content", ""),
                        category_id=note.get("category_id", ""),
                        tag_ids=note.get("tag_ids", []),
                        user_id=note.get("user_id", 0),
                        created_at=note.get("created_at").isoformat() if note.get("created_at") else "",
                        updated_at=note.get("updated_at").isoformat() if note.get("updated_at") else ""
                    )
                    
                    if category:
                        result.category.CopyFrom(category)
                    
                    result.tags.extend(tags)
                    search_results.append(result)
                
                return notes_search_pb2.SearchNotesResponse(
                    notes=search_results,
                    total=total
                )
                
            finally:
                db.close()
                
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal server error: {str(e)}")
            return notes_search_pb2.SearchNotesResponse()


async def serve_grpc():
    """Inicia el servidor gRPC"""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    notes_search_pb2_grpc.add_NotesSearchServiceServicer_to_server(
        NotesSearchServicer(), server
    )
    
    listen_addr = '[::]:50051'
    server.add_insecure_port(listen_addr)
    
    print(f"Starting Notes gRPC server on {listen_addr}")
    await server.start()
    await server.wait_for_termination()


if __name__ == '__main__':
    asyncio.run(serve_grpc())