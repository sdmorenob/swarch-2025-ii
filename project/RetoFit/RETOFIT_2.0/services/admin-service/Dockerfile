FROM php:8.2-apache
WORKDIR /var/www/html
COPY . .
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install
EXPOSE 8006
CMD ["php", "-S", "0.0.0.0:8006", "-t", "public"]