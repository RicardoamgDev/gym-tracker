# Guía: desplegar Gym Tracker (Laravel + React + MySQL) en Coolify (Docker Compose)

Guía específica para **este** repo (`gym-tracker`): **API Laravel 12 + Sanctum**, **SPA React
(Vite + Ant Design)** y **MySQL**, todo en un único recurso *Docker Compose* de Coolify
conectado a GitHub. Basada en un despliegue real y funcionando de la misma arquitectura.

---

## 0. Arquitectura

Un solo recurso **Docker Compose**, construido desde el repo, con 4 servicios en la misma
red (se resuelven por nombre entre sí, sin configurar redes):

| Servicio     | Imagen / build       | Puerto interno | Rol                                  |
|--------------|----------------------|----------------|--------------------------------------|
| `mysql`      | `mysql:8.0`          | 3306           | Base de datos                        |
| `phpmyadmin` | `phpmyadmin:5`       | 8080           | Administración web de la BD          |
| `backend`    | build `./backend`    | **8080**       | API Laravel (PHP-FPM + Nginx)        |
| `frontend`   | build `./frontend`   | 80             | SPA React servida por Nginx estático |

Como comparten la red del compose, el backend usa `DB_HOST=mysql` (nombre del servicio),
no `127.0.0.1`.

> **Puerto del backend = 8080.** La imagen `serversideup/php:*-fpm-nginx` escucha en 8080,
> no en 80. Si expones 80, el proxy devuelve **503 / "no available server"**.

> **Auth = Sanctum (tokens Bearer).** El frontend y el backend van en **dominios distintos**,
> así que se usa autenticación por **token** (no cookies de sesión SPA). No hace falta
> `SANCTUM_STATEFUL_DOMAINS`; sí hace falta **CORS** correcto (ver §4).

---

## 1. Preguntas frecuentes

**¿Claude se conecta a Coolify por MCP?** No hay conector oficial en el registro de MCP.
Coolify tiene API REST propia; el flujo estándar es el panel web (o `curl` a su API).

**¿Qué gestor de paquetes usa el front?** **pnpm** (`pnpm-lock.yaml`, v9.0). El Dockerfile usa
`pnpm install --frozen-lockfile` con caché de store de BuildKit para builds rápidos y reproducibles.

**¿De dónde salen los aceleradores de build?** (1) cache de capas Docker (copiar manifiestos
antes que el código), (2) build multi-stage (imagen final liviana: solo Nginx + estáticos),
(3) `pnpm install --frozen-lockfile` + store cacheado por BuildKit. Todo aplicado abajo.

---

## 2. Archivos a crear en el repo

### `docker-compose.yaml` (raíz)

```yaml
services:
  mysql:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-gym_tracker}
      MYSQL_USER: ${MYSQL_USER:-gym_tracker}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10

  phpmyadmin:
    image: phpmyadmin:5
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      UPLOAD_LIMIT: 64M
    expose:
      - "8080"          # asignar dominio en Coolify
    depends_on:
      mysql:
        condition: service_healthy

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    expose:
      - "8080"          # serversideup escucha en 8080; dominio API -> 8080
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      APP_URL: ${APP_URL}
      APP_KEY: ${APP_KEY}
      # serversideup autorun: migra y cachea al arrancar (arranca como root vía s6)
      AUTORUN_ENABLED: "true"
      AUTORUN_LARAVEL_MIGRATION: "true"
      AUTORUN_LARAVEL_CONFIG_CACHE: "true"
      AUTORUN_LARAVEL_ROUTE_CACHE: "true"
      AUTORUN_LARAVEL_VIEW_CACHE: "true"
      AUTORUN_LARAVEL_STORAGE_LINK: "true"
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: ${MYSQL_DATABASE:-gym_tracker}
      DB_USERNAME: ${MYSQL_USER:-gym_tracker}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      SESSION_DRIVER: database
      QUEUE_CONNECTION: database
      CACHE_STORE: database
      # CORS: dominio del frontend (ver config/cors.php y §4)
      FRONTEND_URL: ${FRONTEND_URL}
    volumes:
      - backend-storage:/var/www/html/storage/app/public
    depends_on:
      mysql:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${FRONTEND_API_URL}   # se hornea en build (incluye /api)
    restart: unless-stopped
    expose:
      - "80"            # nginx estático escucha en 80

volumes:
  mysql-data:
  backend-storage:
```

> **`expose`, no `ports`.** Con dominios en Coolify, Traefik enruta por la red interna.
> Publicar `ports` puede provocar conflictos y `exit code 255` al arrancar.

> **Sin `JWT_SECRET`.** Este proyecto usa Sanctum; los tokens se guardan en la tabla
> `personal_access_tokens` (creada por `php artisan install:api`). No añadas variables de JWT.

### `backend/Dockerfile` (Laravel 12, multi-stage, sin entrypoint propio)

```dockerfile
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
```

> **Dos claves de esta imagen:**
> 1. `composer install` NO se corre aquí (falla como `www-data`, `exit 2`). Se hace en la
>    etapa `composer:2` con `--ignore-platform-reqs` y se copia `vendor`.
> 2. **No sobrescribir el ENTRYPOINT.** s6-overlay debe arrancar como root; forzarlo como
>    `www-data` deja el servidor sin levantar → "no available server". Para tareas de
>    arranque, usar las variables `AUTORUN_*` (no un entrypoint propio).

### `frontend/Dockerfile` (React + Vite, multi-stage, pnpm)

```dockerfile
FROM node:20-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# pnpm 9 vía corepack (el lockfile es v9.0)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# store de pnpm cacheado por BuildKit -> instalaciones muy rápidas en rebuilds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

> **pnpm.** El front usa pnpm (`pnpm-lock.yaml`, lockfile v9.0). `package.json` incluye
> `pnpm.onlyBuiltDependencies: [esbuild]` para que `vite build` pueda compilar esbuild.
> No mezcles gestores: elimina `package-lock.json` del repo. El `--mount=type=cache` de
> BuildKit (que Coolify usa) mantiene el store de pnpm entre builds → rebuilds mucho más rápidos.

> **Dependencias directas.** Con pnpm el `node_modules` es estricto: todo lo que el código
> importe debe estar en `package.json`. Por eso `@ant-design/icons` va declarado explícito
> (antes funcionaba de rebote por ser dependencia de antd).

> `VITE_API_URL` debe incluir `/api` porque el front lo usa tal cual:
> `frontend/src/constants/baseUrl.js` → `import.meta.env.VITE_API_URL`.

### `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }   # SPA fallback (React Router)
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
}
```

### `.dockerignore`

- `backend/.dockerignore`: `.git node_modules vendor .env .env.* storage/logs/* tests`
- `frontend/.dockerignore`: `node_modules dist .git .env .env.*`

---

## 3. Pasos en Coolify (UI)

1. **Proyecto → Environment (production) → + New Resource**.
2. **Git Based → Private Repository (with GitHub App)** (o *Public Repository*).
   No hay tarjeta "Docker Compose desde Git": se entra por el flujo Git y se cambia el Build Pack.
3. Repo + **Branch** `master`.
4. **Build Pack → Docker Compose**. En **Docker Compose Location** → `/docker-compose.yaml`.
5. **Continue**. Coolify parsea el compose y muestra **Domains for <servicio>**.
6. **Domains**: dominio para `backend`, `phpmyadmin` y `frontend`.
7. **Environment Variables**:
   ```
   MYSQL_ROOT_PASSWORD=<fuerte>
   MYSQL_DATABASE=gym_tracker
   MYSQL_USER=gym_tracker
   MYSQL_PASSWORD=<fuerte, distinta de root>
   APP_URL=https://api.tudominio.cl
   APP_KEY=base64:<php artisan key:generate --show>
   FRONTEND_URL=https://gym.tudominio.cl
   FRONTEND_API_URL=https://api.tudominio.cl/api
   ```
8. **Deploy**.

> **DNS**: cada dominio necesita un registro **A** apuntando a la IP del servidor Coolify
> para el certificado TLS.

---

## 4. CORS (config/cors.php)

Como front y API van en dominios distintos, el backend debe permitir el origen del front.
Ajusta `backend/config/cors.php` para leer el dominio de una variable de entorno:

```php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'allowed_headers' => ['*'],
'supports_credentials' => false,   // auth por token Bearer, no cookies
```

Con Sanctum por token no necesitas `supports_credentials: true` ni dominios stateful.

---

## 5. Post-deploy

- **Verificar backend**: abrir `https://api.tudominio.cl/api/login` → debe dar el JSON
  405 de Laravel (`The GET method is not supported...`). Si da 503/"no available server",
  el backend no arrancó (revisar puerto 8080 y logs).
- **Datos demo / seed** (una sola vez): Terminal del servicio `backend` →
  `php artisan db:seed --force`. El seed crea los grupos musculares compartidos.
- **Acceso a la BD** (phpMyAdmin): servidor `mysql`, usuario `root`
  (`MYSQL_ROOT_PASSWORD`) o `gym_tracker` (`MYSQL_PASSWORD`).
- **Persistencia**: `backend-storage` guarda archivos subidos entre redeploys; `mysql-data`
  guarda la base.

---

## 6. Errores encontrados y sus soluciones

| Síntoma                                                        | Causa                                                       | Solución |
|---------------------------------------------------------------|-------------------------------------------------------------|----------|
| `composer install ... exit code 2`                            | Composer como `www-data` / extensiones del lock             | Multi-stage con `composer:2` + `--ignore-platform-reqs`, copiar `vendor` |
|