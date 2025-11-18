FROM php:8.2-cli
WORKDIR /var/www/html

# Instala dependencias del sistema y extensiones de PHP para PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install zip pdo pdo_pgsql pgsql \
    && rm -rf /var/lib/apt/lists/*

# Instala Composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copia archivos de dependencias primero (optimización de caché)
COPY composer.json composer.lock* ./

# Instala dependencias de Composer
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copia el resto del código
COPY . .

# Ejecuta scripts post-instalación si existen
RUN composer dump-autoload --optimize

# Crea el directorio public si no existe
RUN mkdir -p public

# Expone el puerto
EXPOSE 8006

# Inicia el servidor PHP
CMD ["php", "-S", "0.0.0.0:8006", "-t", "public"]