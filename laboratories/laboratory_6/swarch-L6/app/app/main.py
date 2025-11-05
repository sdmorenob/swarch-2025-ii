import sys
import os

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse

from app.core.populate_transactions import generate_transactions
from app.routes.endpoint import router


current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

app = FastAPI()
app.include_router(router)

@app.get("/")
def serve_index():
    return FileResponse(f"{current_dir}/static/index.html")

if __name__ == "__main__":
    generate_transactions(1000000)
    uvicorn.run(app, host="0.0.0.0", port=8000)