# ChatApp — FastAPI + Angular 21 + PostgreSQL

Sistema de chat en tiempo real con canales temáticos, autenticación JWT y WebSockets.

- **App:** https://ug-disc-chat.vercel.app
- **API:** https://ug-disc-chat.onrender.com/docs

## Stack
- **Backend:** FastAPI + SQLAlchemy Async + asyncpg
- **Frontend:** Angular 21 (Standalone Components + Signals + Block Control Flow)
- **Base de Datos:** PostgreSQL gestionado (Neon)
- **Despliegue:** Render (Backend) + Vercel (Frontend)

## Documentación

| Documento | Contenido |
|---|---|
| [Manual técnico](docs/manual-tecnico.md) | Arquitectura, protocolo WebSocket, instalación y despliegue |
| [Manual de usuario](docs/manual-usuario.md) | Guía de uso de la aplicación |
| [Plan de pruebas](docs/plan-de-pruebas.md) | Estrategia, alcance y resultados de las 82 pruebas |
| [Guion de sustentación](docs/guion-sustentacion.md) | Estructura de la exposición oral |

---

## Setup Local

### 1. Base de Datos
Ejecutar `supabase_schema.sql` contra la base de datos. Crea las tablas, el índice de
historial y los tres canales iniciales.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# Ejecutar
uvicorn app.main:app --reload
# API disponible en: http://localhost:8000
# Documentación: http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve
# App disponible en: http://localhost:4200
```

---

## Variables de Entorno (Backend)

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET_KEY` | Clave secreta para firmar JWTs (mín. 32 chars) |
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host/db` |
| `ALLOWED_ORIGINS` | JSON array de orígenes CORS permitidos |
| `DEBUG` | `True` en desarrollo, `False` en producción |
| `DB_SSL` | `require` en producción (Neon). `disable` para un Postgres local |

### Pruebas del backend

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest tests -q
```

---

## Despliegue

### Render (Backend)
1. Crear nuevo Web Service → Deploy from GitHub repo
2. Seleccionar la carpeta `backend/` como Root Directory
3. Render detecta el `Dockerfile` automáticamente
4. Agregar variables de entorno en el panel del servicio:
   - `JWT_SECRET_KEY`
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS=["https://tu-app.vercel.app"]`
   - `DEBUG=False`

### Vercel (Frontend)
1. Crear nuevo proyecto → Import Git Repository
2. Configurar:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build -- --configuration production`
   - **Output Directory:** `dist/frontend/browser`
3. Actualizar `environment.prod.ts` con la URL de Render antes del deploy

---

## Estructura del Proyecto

```
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, dependencies
│   │   ├── db/            # models, base (SQLAlchemy)
│   │   ├── repositories/  # capa de acceso a datos
│   │   ├── services/      # lógica de negocio
│   │   ├── api/v1/        # rutas HTTP
│   │   ├── sockets/       # WebSocket manager + handler
│   │   └── schemas/       # Pydantic DTOs
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   └── src/app/
│       ├── core/          # services, guards, interceptors, pipes
│       └── features/
│           ├── auth/      # login, register
│           └── chat/      # layout, channel-list, message-list, input
│
└── supabase_schema.sql
```

## Protocolo WebSocket

Conexión: `ws://host/ws/{channel_id}?token=<JWT>`

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `history_batch` | Server→Client | Historial inicial (últimos 20 msgs) |
| `message` | Bidireccional | Mensaje de chat persistido |
| `typing` | Bidireccional | Indicador "está escribiendo..." |
| `user_list` | Server→Client | Lista completa de conectados al canal; fuente de verdad de la presencia |
| `user_joined` | Server→Client | Notificación de entrada al canal |
| `user_left` | Server→Client | Notificación de salida del canal |

Códigos de cierre WebSocket:
- `4001` — JWT inválido o expirado
- `4002` — Channel ID inválido
