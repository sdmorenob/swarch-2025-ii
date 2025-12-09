import asyncio
import grpc
from concurrent import futures
from typing import List
from sqlalchemy import or_

from app.database.postgres import get_db
from app.models.postgres_models import Task
from app.grpc.generated import tasks_search_pb2, tasks_search_pb2_grpc, common_pb2
from app.services.serialization import expand_category, expand_tags


class TasksSearchServicer(tasks_search_pb2_grpc.TasksSearchServiceServicer):
    """Implementación del servicio gRPC para búsqueda de tareas"""
    
    def SearchTasks(self, request, context):
        """Busca tareas basado en los criterios proporcionados"""
        try:
            # Validaciones
            if len(request.query) > 1000:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Query too long")
                return tasks_search_pb2.SearchTasksResponse()
            
            if request.limit <= 0:
                limit = 20
            elif request.limit > 100:
                limit = 100
            else:
                limit = request.limit
            
            skip = max(0, request.skip)
            
            # Obtener conexión a base de datos
            db_gen = get_db()
            db = next(db_gen)
            
            try:
                # Construir query base (solo por usuario y texto)
                query = db.query(Task).filter(Task.user_id == request.user_id)
                
                # Búsqueda de texto en title y description
                if request.query:
                    search_filter = or_(
                        Task.title.ilike(f"%{request.query}%"),
                        Task.description.ilike(f"%{request.query}%")
                    )
                    query = query.filter(search_filter)
                
                # Cargar tareas sin filtros de catálogo (se filtra en memoria por nombre)
                tasks = query.order_by(Task.updated_at.desc()).all()
                
                filtered = []
                requested_tags = list(request.tags)
                requested_category = request.category or ""
                req_cat_lower = requested_category.lower()
                req_tags_lower = [t.lower() for t in requested_tags]
                
                for task in tasks:
                    # Expandir categoría y tags vía HTTP
                    cat = expand_category(task.category_id, request.user_id) if task.category_id else None
                    tags = expand_tags(task.tag_ids or [], request.user_id)
                    
                    # Filtrado en memoria por nombre de categoría
                    if requested_category:
                        if not cat or req_cat_lower not in (cat.get("name") or "").lower():
                            continue
                    
                    # Filtrado en memoria por nombre de tag (al menos uno debe coincidir)
                    if req_tags_lower:
                        tag_names_lower = [(t.get("name") or "").lower() for t in tags]
                        if not any(name in tag_names_lower for name in req_tags_lower):
                            continue
                    
                    # Construir resultados gRPC
                    category_pb = None
                    if cat:
                        category_pb = common_pb2.CategorySummary(
                            id=str(cat.get("id")),
                            name=cat.get("name") or "",
                            color=cat.get("color") or ""
                        )
                    tag_pbs = [
                        common_pb2.TagSummary(
                            id=str(t.get("id")),
                            name=t.get("name") or "",
                            color=t.get("color") or ""
                        ) for t in tags
                    ]
                    
                    result = tasks_search_pb2.TaskSearchResult(
                        id=task.id,
                        title=task.title,
                        description=task.description or "",
                        completed=task.completed,
                        priority=task.priority,
                        due_date=task.due_date.isoformat() if task.due_date else "",
                        user_id=task.user_id,
                        created_at=task.created_at.isoformat() if task.created_at else "",
                        updated_at=task.updated_at.isoformat() if task.updated_at else ""
                    )
                    if category_pb:
                        result.category.CopyFrom(category_pb)
                    result.tags.extend(tag_pbs)
                    filtered.append(result)
                
                total = len(filtered)
                # Paginación en memoria
                page_slice = filtered[skip:skip+limit]
                
                return tasks_search_pb2.SearchTasksResponse(
                    tasks=page_slice,
                    total=total
                )
                
            finally:
                db.close()
                
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal server error: {str(e)}")
            return tasks_search_pb2.SearchTasksResponse()


def serve_grpc():
    """Inicia el servidor gRPC"""
    import os
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    tasks_search_pb2_grpc.add_TasksSearchServiceServicer_to_server(
        TasksSearchServicer(), server
    )
    
    listen_addr = '[::]:50052'
    # Soporte TLS/mTLS opcional por entorno
    enable_tls = os.getenv('GRPC_TLS_ENABLE', 'false').lower() == 'true'
    if enable_tls:
        cert_path = os.getenv('GRPC_TLS_CERT_PATH', '')
        key_path = os.getenv('GRPC_TLS_KEY_PATH', '')
        ca_path = os.getenv('GRPC_TLS_CLIENT_CA_PATH', '')
        try:
            with open(cert_path, 'rb') as f:
                cert_chain = f.read()
            with open(key_path, 'rb') as f:
                private_key = f.read()
            root_certs = None
            require_client_auth = False
            if ca_path:
                with open(ca_path, 'rb') as f:
                    root_certs = f.read()
                    require_client_auth = True
            creds = grpc.ssl_server_credentials(
                [(private_key, cert_chain)],
                root_certificates=root_certs,
                require_client_auth=require_client_auth,
            )
            server.add_secure_port(listen_addr, creds)
            print(f"Starting Tasks gRPC server (TLS) on {listen_addr}")
        except Exception as e:
            server.add_insecure_port(listen_addr)
            print(f"[WARN] TLS disabled due to error: {e}. Starting insecure gRPC at {listen_addr}")
    else:
        server.add_insecure_port(listen_addr)
        print(f"Starting Tasks gRPC server on {listen_addr}")
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    serve_grpc()