# Use Python base image
FROM python:3.10-slim

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port
EXPOSE 8083

# Run the ASGI app combining FastAPI and Socket.IO
CMD ["uvicorn", "main:combined_app", "--host", "0.0.0.0", "--port", "8083"]