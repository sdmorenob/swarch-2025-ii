import asyncio
import os

import grpc
from app.servicers.RecommendationServicer import RecommendationServicer, pb2g

async def grpc_server():
    server = grpc.aio.server()
    pb2g.add_RecommendationServicer_to_server(RecommendationServicer(), server)
    listen_addr = os.getenv("GRPC_ADDR", "[::]:8000")
    server.add_insecure_port(listen_addr)
    print(f"[gRPC] listening on {listen_addr}")
    await server.start()
    
    try:
        # On Windows, we can't use signal handlers, so we just wait for termination
        print("[gRPC] Server started. Press Ctrl+C to stop.")
        await server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n[gRPC] KeyboardInterrupt received")
    except asyncio.CancelledError:
        print("[gRPC] Server cancelled")
    finally:
        print("[gRPC] Shutting down server...")
        try:
            await asyncio.wait_for(server.stop(grace=5), timeout=10)
            print("[gRPC] Server stopped gracefully")
        except (asyncio.CancelledError, asyncio.TimeoutError):
            print("[gRPC] Server shutdown interrupted or timed out")
        except Exception as e:
            print(f"[gRPC] Error during shutdown: {e}")