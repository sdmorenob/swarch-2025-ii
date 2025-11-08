# Tasks Service (FastAPI)

Servicio micro de tareas conectado a PostgreSQL.

## Estructura
```
app/
  main.py
  database/postgres.py
  models/postgres_models.py
  schemas/task_schemas.py
  services/serialization.py
  routers/tasks.py
```

## Ejecutar
```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
set DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/tasknotes
uvicorn app.main:app --reload --port 8003
```

## Notas
- Usa el mismo esquema de `tasks`, `categories`, `tags` y `task_tags` del backend.
- `X-User-Id` determina el usuario (por defecto 1 si no se envía).