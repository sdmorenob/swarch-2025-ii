FROM python:3.12-slim
# Instalamos dependencias necesarias para compilar mysqlclient
RUN apt update && apt install -y \
gcc \
default-libmysqlclient-dev \
build-essential \
pkg-config
RUN apt clean
RUN rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app /app
CMD ["python", "app.py"]