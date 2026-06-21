# Gym Tracker

App web para registrar entrenamientos y ver progresión (día a día, semana a semana) y reparto por grupo muscular.

- **Backend:** Laravel 11 + MySQL (API REST)
- **Frontend:** React + Vite + Ant Design (charts con Recharts)

## Estructura

```
gym-tracker/
├── backend/_overlay/   # archivos de la app (modelos, controladores, migraciones, rutas)
├── frontend/           # React + Vite + AntD (proyecto completo, npm install)
├── setup-backend.bat   # script de setup automático (Windows)
└── setup-backend.sh    # script de setup automático (macOS/Linux)
```

---

## 1. Backend (Laravel + MySQL)

### Forma rápida (recomendada): un solo script

Requisitos ya instalados: PHP 8.2+, Composer y MySQL.

En **Windows**, doble clic a `setup-backend.bat` (o desde la terminal):

```bat
setup-backend.bat
```

En **macOS/Linux**:

```bash
./setup-backend.sh
```

El script crea el proyecto Laravel, instala Sanctum, copia los archivos de la app
(`backend/_overlay`), te pide tus credenciales de MySQL, crea la base `gym_tracker`,
corre `migrate --seed` y arranca la API en http://localhost:8000.

### Forma manual

```bash
composer create-project laravel/laravel backend_base
cd backend_base
composer require laravel/sanctum
php artisan install:api
# copia encima los archivos de backend/_overlay (app/, database/, routes/)
```

### .env

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gym_tracker
DB_USERNAME=root
DB_PASSWORD=
```

```sql
CREATE DATABASE gym_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

### CORS (config/cors.php)

```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

## 2. Frontend (React + Vite + AntD)

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

`.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Autenticación (Sanctum)

La API usa tokens Bearer de Laravel Sanctum. En Laravel 11:

```bash
php artisan install:api      # instala Sanctum y crea la migración personal_access_tokens
php artisan migrate --seed
```

`app/Models/User.php` ya usa el trait `HasApiTokens`. Las rutas de datos están
protegidas con el middleware `auth:sanctum`; sólo `register` y `login` son públicas.

Flujo: el frontend hace `POST /api/login` o `/api/register`, guarda el `token`
devuelto en `localStorage` y lo envía como `Authorization: Bearer <token>` en cada
petición (gestionado por el interceptor de axios). Cada usuario sólo ve sus propios
ejercicios y entrenamientos. Los grupos musculares del seed son compartidos.

### Endpoints de auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/register | name, email, password, password_confirmation |
| POST | /api/login | email, password -> { user, token } |
| GET | /api/me | usuario autenticado |
| POST | /api/logout | revoca el token actual |

## Modelo de datos

- **muscle_groups**: grupos musculares (Pecho, Espalda, Piernas...).
- **exercises**: ejercicios, ligados a un grupo muscular.
- **workouts**: una sesión (fecha, duración, notas).
- **workout_sets**: cada serie (reps, peso, rpe).

Volumen = sum(reps × peso).

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | /api/muscle-groups | grupos |
| GET/POST | /api/exercises | ejercicios |
| GET/POST | /api/workouts | sesiones (con series) |
| GET/PUT/DELETE | /api/workouts/{id} | ver/editar/borrar |
| GET | /api/stats/progression?exercise_id= | progresión peso/volumen |
| GET | /api/stats/weekly-volume | volumen por semana |
| GET | /api/stats/muscle-distribution | reparto muscular |
| GET | /api/stats/calendar | días entrenados |
