# Dockerfile

# Usa una imagen base de Python
FROM python:3.13.7-slim

# Establece el directorio de trabajo dentro del contenedor
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]