# Dockerfile

# Usa una imagen base de Python
FROM python:3.13.7-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8004
EXPOSE 50051
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004", "--reload"]