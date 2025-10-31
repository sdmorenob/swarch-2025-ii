# app/grpc/server.py

import grpc
from grpc_reflection.v1alpha import reflection
from concurrent import futures
import logging

from app.grpc import user_pb2, user_pb2_grpc
from app.db.session import SessionLocal
from app.db.models import User  # ajusta el nombre si tu modelo es distinto


class UserServiceServicer(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        db = SessionLocal()
        user = db.query(User).filter(User.id_usuario == request.id).first()

        if not user:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"User with id {request.id} not found")
            return user_pb2.UserResponse()

        return user_pb2.UserResponse(
            id=user.id_usuario,
            name=user.nombre,
            email=user.correo,
        )


async def serve_grpc() -> None:
    server = grpc.aio.server()
    user_pb2_grpc.add_UserServiceServicer_to_server(UserServiceServicer(), server)

    SERVICE_NAMES = (
        user_pb2.DESCRIPTOR.services_by_name["UserService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    server.add_insecure_port("[::]:50051")
    logging.info("✅ gRPC server running on port 50051")
    await server.start()
    await server.wait_for_termination()
