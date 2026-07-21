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

**¿Qué gestor de paquetes usa el front?** **pnpm 11.11.0** (fijado en `packageManager`). El Dockerfile usa
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
FROM node:22-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Misma versión de pnpm que en local (ver "packageManager" en package.json)
RUN npm install -g pnpm@11.11.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# store de pnpm cacheado por BuildKit -> instalaciones muy rápidas en rebuilds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

> **Node 22 obligatorio.** pnpm 11 exige `node >= 22.13`. Con `node:20-alpine` el
> `npm install -g pnpm@11` pasa (npm solo avisa) pero `pnpm install` muere con exit 1 y
> BuildKit no muestra el motivo. Si cambias la versión de pnpm, revisa antes su campo
> `engines` (`npm view pnpm@X engines`).

> **pnpm 11, fijado.** `package.json` declara `"packageManager": "pnpm@11.11.0"` y el
> Dockerfile instala esa misma versión: local y CI resuelven idéntico. Toda la config de
> pnpm vive en `pnpm-workspace.yaml` — desde pnpm 10 el campo `pnpm` de `package.json`
> **se ignora**. No mezcles gestores: elimina `package-lock.json`. El `--mount=type=cache`
> de BuildKit (que Coolify usa) mantiene el store entre builds → rebuilds mucho más rápidos.

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

    # SPA fallback (React Router)
    location / { try_files $uri $uri/ /index.html; }

    # Assets con hash: cachear a tope
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }

    # PWA: nunca cachear el service worker ni el manifest,
    # o los usuarios se quedan pegados en una versión vieja.
    location = /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location = /registerSW.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location = /manifest.webmanifest {
        expires off;
        add_header Cache-Control "no-cache";
        types { } default_type application/manifest+json;
    }
    location = /index.html {
        expires off;
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml application/manifest+json;
}
```

### `frontend/pnpm-workspace.yaml`

```yaml
packages:
  - .

allowBuilds:
  esbuild: true

minimumReleaseAge: 1440
```

> Aquí vive **toda** la configuración de pnpm 10+. Tres claves:
> 1. `packages: [.]` — sin esto `pnpm install` falla con *"packages field missing or empty"*
>    (pnpm puede autogenerar el archivo con un placeholder inservible).
> 2. `allowBuilds: {esbuild: true}` — pnpm 10+ **bloquea** los scripts de instalación por
>    defecto; sin esta línea el build muere con `ERR_PNPM_IGNORED_BUILDS: esbuild`.
>    (En pnpm 9 la clave era `onlyBuiltDependencies` y vivía en `package.json`.)
> 3. `minimumReleaseAge: 1440` — no aceptar paquetes publicados en las últimas 24 h.
>    Declararlo en el repo hace que el lockfile resuelva igual en tu máquina y en el build;
>    si no, quien tenga la política activa verá `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`.
>
> El Dockerfile debe copiarlo junto a `package.json` y `pnpm-lock.yaml`.

### `.dockerignore`

- `backend/.dockerignore`: `.git node_modules vendor .env .env.* storage/logs/* tests .fuse_hidden*`
- `frontend/.dockerignore`: `node_modules dist .git .env .env.* .fuse_hidden*`

---

## 3. PWA (instalable + offline de lectura)

El frontend es una **PWA** vía `vite-plugin-pwa` (Workbox). Piezas:

- `vite.config.js` → plugin `VitePWA` con el *manifest* (nombre, `display: standalone`,
  `theme_color` grafito, iconos 192/512 + maskable) y `registerType: 'autoUpdate'`.
- `frontend/public/` → `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`,
  `apple-touch-icon.png`, `favicon-32x32.png`, `icon.svg`.
- `index.html` → `theme-color` y `apple-touch-icon` (iOS **no** lee el manifest para el icono).
- Estrategias de caché:
  - App shell (JS/CSS/HTML) → **precache**, por eso abre sin conexión.
  - `/api/*` (GET) → **NetworkFirst** con 5 s de timeout: si no hay red, sirve lo último cacheado.
  - Google Fonts → **CacheFirst**.

> **HTTPS obligatorio** para instalar. Coolify ya lo da con Let's Encrypt.

> **Sólo offline de lectura.** Registrar un entrenamiento sin conexión requeriría una cola
> local (IndexedDB) + sincronización al recuperar red. No está implementado.

> **Privacidad:** las respuestas de la API quedan en la caché del navegador (`api-cache`).
> Para una app personal es aceptable; en equipos compartidos, conviene revisarlo.

---

## 4. Pasos en Coolify (UI)

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

## 5. CORS (config/cors.php)

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

## 6. Post-deploy

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

## 7. Errores encontrados y sus soluciones

| Síntoma | Causa | Solución |
|---|---|---|
| `composer install ... exit code 2` | Composer como `www-data` / extensiones del lock | Multi-stage con `composer:2` + `--ignore-platform-reqs`, copiar `vendor` |
| `pnpm install` exit 1 en Docker, sin más detalle | Imagen base con Node < 22.13 y pnpm 11 | Usar `node:22-alpine` |
| `ERR_PNPM_IGNORED_BUILDS: esbuild` | pnpm 10+ bloquea scripts de instalación por defecto | `allowBuilds: {esbuild: true}` en `pnpm-workspace.yaml` |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Lockfile resuelto sin la política de antigüedad | Declarar `minimumReleaseAge` en el repo y regenerar el lock |
| `The "pnpm" field in package.json is no longer read` | Config de pnpm en el sitio antiguo | Moverla a `pnpm-workspace.yaml` |
| `pnpm ... packages field missing or empty` | `pnpm-workspace.yaml` con placeholder autogenerado | Contenido válido: `packages: [.]` |
| `ERR_PNPM_OUTDATED_LOCKFILE` | `pnpm-lock.yaml` desincronizado con `package.json` | Regenerar el lock (`pnpm install`) y commitear |
| `Rollup failed to resolve import "X"` | Import no declarado en `package.json` (pnpm es estricto) | Añadir la dependencia directa (p. ej. `@ant-design/icons`) |
| `docker compose up -d ... exit code 255` | Conflicto de puertos publicados | `expose:` en lugar de `ports:` |
| API responde **503 / CORS Missing Allow Origin** | Backend enrutado al puerto equivocado | `expose: 8080` (puerto real de serversideup) |
| **"no available server"** en el dominio del backend | ENTRYPOINT propio arrancaba s6 como `www-data` | Quitar ENTRYPOINT; usar variables `AUTORUN_*` |
| Login/registro fallan con **CORS** desde el front | `allowed_origins` no incluye el dominio del front | `FRONTEND_URL` en el compose + `config/cors.php` (§5) |
| Front no llega a la API tras cambiar el dominio del backend | `VITE_API_URL` se hornea en build | **Rebuild** del frontend (no basta reiniciar) |
| Front pega a `/loginlogin` o rutas raras | `VITE_API_URL` sin `/api` o con `/` final | Usar `https://apigymtracker.tudominio/api` (sin slash final) |
| La PWA no se actualiza en el móvil | `sw.js` cacheado por el navegador | `no-cache` en `sw.js` y `index.html` (ver `nginx.conf`) |

---

## 8. Seguridad

- `APP_KEY` **nuevo** para producción (no reutilizar el del `.env` local).
- Contraseñas de BD **fuertes y distintas** para `root` y el usuario de la app.
- Nunca poner secretos en el `docker-compose.yaml` del repo: van solo en *Environment
  Variables* de Coolify (el compose los referencia con `${VAR}`).
- Proteger o restringir por IP el dominio de phpMyAdmin.
- Cada usuario sólo ve sus propios ejercicios y entrenamientos (autorización por
  `user_id` en el backend); verifica que las rutas de datos siguen bajo `auth:sanctum`.
- `minimumReleaseAge` en `pnpm-workspace.yaml` reduce la exposición a paquetes recién
  publicados (ataques de cadena de suministro).

---

## 9. Despliegue continuo

Con el webhook de GitHub activo, cada `git push` a `master` dispara auto-deploy:
el backend re-ejecuta migraciones al arrancar (AUTORUN) y el frontend se reconstruye.
El service worker se actualiza solo en el móvil (`registerType: 'autoUpdate'`).
