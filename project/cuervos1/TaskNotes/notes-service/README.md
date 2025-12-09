# Notes Service (FastAPI)

Servicio micro de notas con MongoDB y enriquecimiento de categoría/tags desde PostgreSQL.

## Estructura
```
app/
  main.py
  database/mongodb.py
  database/postgres.py
  models/mongodb_models.py
  models/postgres_models.py
  schemas/note_schemas.py
  services/expand.py
  routers/notes.py
```

## Ejecutar
```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
set MONGODB_URL=mongodb://localhost:27017
set MONGODB_DB=tasknotes
set POSTGRES_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/tasknotes
uvicorn app.main:app --reload --port 8004
```

## Notas
- Guarda notas en MongoDB; `note_history` registra eventos básicos.
- Expande `category` y `tags` consultando PostgreSQL.
- `X-User-Id` determina el usuario (por defecto 1 si no se envía).