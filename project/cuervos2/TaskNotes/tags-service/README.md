# Categories & Tags Service (FastAPI)

FastAPI microservice for managing categories and tags with PostgreSQL (database-per-service).

## Environment
- `DATABASE_URL`: PostgreSQL URL. Default: `postgresql+psycopg2://postgres:postgres@postgres:5432/tasknotes_categories_tags`

## Run (Docker Compose)
- `docker compose -f TaskNotes/docker-compose.micro.yml up -d --build categories-tags-service`

## Health
- `GET /healthz` → `{ "ok": true }`

## Tags
- `POST /tags` → `{ "name": "urgent", "color": "#ff0000" }`
- `GET /tags?ids=1,2` → list tags (filters optional)
- `PUT /tags/{id}` → update name/color
- `DELETE /tags/{id}` → 204
- Internal: `GET /internal/tags?ids=...` → used by orchestrators (Search)

## Categories
- `POST /categories` → `{ "name": "Work", "color": "#3366ff", "description": ".." }`
- `GET /categories` → list categories
- `GET /categories/{id}` → get category
- `PUT /categories/{id}` → update
- `DELETE /categories/{id}` → 204
- Link tag: `POST /categories/{id}/tags` → `{ "tag_id": 1 }`
- Unlink tag: `DELETE /categories/{id}/tags/{tag_id}` → 204

## Notes
- Tables auto-create on startup. For a dedicated DB, create it inside Postgres:
  `docker exec tasknotes-postgres-1 psql -U postgres -c "CREATE DATABASE tasknotes_categories_tags;"`