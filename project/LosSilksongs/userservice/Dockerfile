# userservice/Dockerfile
FROM python:3.11-slim

# set workdir
WORKDIR /app

# install system deps required for building psycopg2, etc.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# copy requirements and upgrade pip/setuptools before install
COPY requirements.txt .

# upgrade pip/setuptools/wheel to reduce build issues, then install deps
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# copy app
COPY app ./app

ENV PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--proxy-headers"]
