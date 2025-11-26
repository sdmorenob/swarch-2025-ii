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
EXPOSE 8083 8443

# Startup script that switches HTTP/HTTPS based on env & certs
COPY start.sh .
CMD ["sh", "start.sh"]