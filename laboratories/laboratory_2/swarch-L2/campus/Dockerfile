# Stage 1: Build stage
FROM gradle:8-jdk24 AS builder

# Set working directory
WORKDIR /app

# Copy Gradle files first for better caching
COPY build.gradle settings.gradle ./
COPY gradle/ gradle/
COPY gradlew gradlew.bat ./

# Download dependencies (this layer will be cached if dependencies don't change)
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY src/ src/

# Build the application
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime stage
FROM openjdk:24-jdk-slim

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Copy the built JAR from build stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership to spring user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]