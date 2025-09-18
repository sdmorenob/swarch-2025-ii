import sys
import os
import asyncio

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.core.grpc_server import grpc_server
from app.core.migrations.migrations import run_migrations

async def main():
    await run_migrations()
    await grpc_server()


if __name__ == "__main__":
    asyncio.run(main())