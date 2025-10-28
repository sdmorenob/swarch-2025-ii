# ===========================
# Build de la app
# ===========================
FROM maven:3.9.6-eclipse-temurin-21 AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos del proyecto
COPY pom.xml .
COPY src ./src

# Compilar el proyecto (salida en target/)
RUN mvn clean package -DskipTests

# ===========================
# Imagen final
# ===========================
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copiar el .jar generado desde la etapa anterior
COPY --from=builder /app/target/*.jar app.jar

# Variables de entorno por defecto (pueden sobreescribirse en docker-compose)
ENV DB_URL=jdbc:postgresql://postgres:5432/music_db
ENV DB_USER=music_user
ENV DB_PASS=music_pass
ENV SERVER_PORT=8083

# Exponer el puerto del servicio
EXPOSE 8083

# Comando de arranque
ENTRYPOINT ["java", "-jar", "app.jar"]
