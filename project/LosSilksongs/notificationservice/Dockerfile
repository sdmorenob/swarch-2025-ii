# Usa una imagen base de Python ligera y oficial.
FROM python:3.9-slim

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copia el archivo de dependencias primero para aprovechar el cache de Docker.
COPY requirements.txt .

# Instala las dependencias.
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación.
COPY main.py .

# Expone el puerto que usará la aplicación.
EXPOSE 8082

# Comando para ejecutar la aplicación cuando se inicie el contenedor.
# El host 0.0.0.0 es necesario para que sea accesible desde fuera del contenedor.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
