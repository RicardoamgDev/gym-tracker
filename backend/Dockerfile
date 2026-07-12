# Etapa 1: dependencias con la imagen oficial de Composer
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist \
    --optimize-autoloader --no-scripts --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev

# Etapa 2: runtime PHP-FPM + Nginx (s6-overlay arranca como root)
FROM serversideup/php:8.3-fpm-nginx
USER root
RUN install-php-extensions pdo_mysql bcmath
USER www-data
WORKDIR /var/www/html
COPY --chown=www-data:www-data --from=vendor /app ./
RUN chmod -R ug+rw storage bootstrap/cache
# NO sobrescribir ENTRYPOINT: la imagen arranca s6 como root.
# Migraciones/cache van por las variables AUTORUN_* del compose.
