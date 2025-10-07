# 🗄️ TaskNotes Database Management

## 📋 Resumen

TaskNotes usa **SQLAlchemy** para crear las tablas directamente, sin necesidad de Alembic. Esto simplifica el proceso de inicialización y es perfecto para prototipos y desarrollo.

## 🚀 Inicialización Automática

### En Docker (Recomendado)
```bash
# Las tablas se crean automáticamente al iniciar el backend
docker-compose up --build
```

### Manualmente
```bash
# Desde el directorio backend/
python init_db.py
```

## 🧱 Arquitectura de datos (PostgreSQL + MongoDB)

- PostgreSQL (SQLAlchemy): usuarios, tareas, categorías y etiquetas. Datos relacionales con claves foráneas y relaciones 1..N y N..N.
- MongoDB (Motor): notas e historial de notas. Documento flexible, escritura rápida, histórico fácil.

Motivación: tareas requieren joins y consistencia relacional (Postgres); notas se benefician de flexibilidad y versionado por documento (Mongo).

## 🧩 Modelos vs Esquemas

- Modelos (SQLAlchemy): definen las tablas y relaciones en `app/models/postgres_models.py`. Se usan para leer/escribir en la BD relacional.
- Esquemas (Pydantic): definen los contratos de la API en `app/schemas/*.py`. Validan requests y serializan responses.

Ejemplo (tareas):
- Request (TaskCreate/TaskUpdate): `category_id: string | null`, `tag_ids: string[]`.
- Response (Task): incluye `category { id,name,color }` y `tags [{ id,name,color }]`, además de campos planos.

Ejemplo (notas):
- Se guardan en Mongo con `category_id` y `tag_ids` (strings)
- En la respuesta, el backend expande `category` y `tags` consultando a PostgreSQL.

## 🏗️ Cómo se crean las tablas

El script `backend/init_db.py` espera a que Postgres esté listo y llama a `create_tables()` de `app/database/postgres.py`, el cual registra los modelos y ejecuta `Base.metadata.create_all(bind=engine)`.

En desarrollo, si cambias los modelos y necesitas reflejar cambios:
- Opción rápida: `python manage_db.py reset` (elimina y recrea tablas; perderás datos).
- Para producción: usar Alembic (migraciones). Ver sección más abajo.

## 🔎 Verificar BD con docker-compose exec

### PostgreSQL
```bash
# Abrir un shell de psql dentro del contenedor
docker-compose exec postgres psql -U user -d tasknotes

-- Dentro de psql:
\dt                             -- listar tablas
\d users                        -- describir tabla users
SELECT COUNT(*) FROM tasks;     -- contar tareas
SELECT * FROM categories LIMIT 5; -- ver categorías
\q                             -- salir
```

Consulta rápida sin entrar a psql:
```bash
docker-compose exec postgres psql -U user -d tasknotes -c "\\dt"
docker-compose exec postgres psql -U user -d tasknotes -c "SELECT COUNT(*) FROM users;"
```

### MongoDB
```bash
# Abrir mongosh (si está disponible en la imagen) o ejecutar scripts
docker-compose exec mongodb mongosh --eval 'db.getSiblingDB("tasknotes").notes.countDocuments()'
docker-compose exec mongodb mongosh --eval 'db.getSiblingDB("tasknotes").notes.find().limit(3).toArray()'

# En una sesión interactiva
docker-compose exec mongodb mongosh
use tasknotes
db.notes.countDocuments()
db.notes.find().limit(3)
exit
```

## 🛠️ Comandos de Gestión

### Script de gestión (`manage_db.py`)
```bash
# Ver estado de la conexión
python manage_db.py status

# Crear todas las tablas
python manage_db.py create

# Eliminar todas las tablas (⚠️ PELIGROSO)
python manage_db.py drop

# Resetear base de datos (eliminar y recrear)
python manage_db.py reset

# Ver ayuda
python manage_db.py help
```

## 📊 Estructura de Tablas

Las siguientes tablas se crean automáticamente:

### `users`
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `hashed_password` (String)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `categories`
- `id` (Primary Key)
- `name` (String)
- `color` (String)
- `description` (Text)
- `user_id` (Foreign Key → users.id)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `tags`
- `id` (Primary Key)
- `name` (String)
- `color` (String)
- `description` (Text)
- `user_id` (Foreign Key → users.id)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `tasks`
- `id` (Primary Key)
- `title` (String)
- `description` (Text)
- `completed` (Boolean)
- `priority` (String)
- `due_date` (DateTime)
- `user_id` (Foreign Key → users.id)
- `category_id` (Foreign Key → categories.id)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `task_tags` (Tabla de relación)
- `task_id` (Foreign Key → tasks.id)
- `tag_id` (Foreign Key → tags.id)

## 🔁 Flujo de datos (alto nivel)

1) Frontend envía `category_id` y `tag_ids` como strings.
2) Router de tareas convierte esos IDs a enteros para guardar en Postgres.
3) Respuesta de tareas expande `category` y `tags` a objetos con color.
4) Notas se guardan en Mongo; al responder, se expanden `category` y `tags` consultando Postgres.

## 🔄 Ventajas de SQLAlchemy Directo

### ✅ **Ventajas:**
- **Simplicidad**: No necesitas configurar Alembic
- **Automático**: Las tablas se crean al iniciar
- **Sin migraciones**: Perfecto para prototipos
- **Menos archivos**: No necesitas archivos de migración
- **Desarrollo rápido**: Cambios inmediatos en modelos

### ⚠️ **Limitaciones:**
- **Sin historial**: No hay control de versiones de esquema
- **Sin rollback**: No puedes deshacer cambios
- **Pérdida de datos**: Cambios en modelos pueden requerir recrear tablas
- **No para producción**: Recomendado solo para desarrollo/prototipos

## 🚨 Cuándo usar Alembic vs SQLAlchemy Directo

### **SQLAlchemy Directo** (Actual)
- ✅ Prototipos y desarrollo
- ✅ Proyectos pequeños
- ✅ Cuando no hay datos importantes
- ✅ Desarrollo rápido

### **Alembic** (Para el futuro)
- ✅ Producción
- ✅ Proyectos con datos importantes
- ✅ Equipos grandes
- ✅ Necesidad de rollbacks
- ✅ Control de versiones de esquema

## 🔧 Troubleshooting

### Error: "Table already exists"
```bash
# Resetear la base de datos
python manage_db.py reset
```

### Error: "Connection refused"
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres
```

### Error: "Permission denied"
```bash
# Verificar permisos del usuario
docker-compose exec postgres psql -U user -d tasknotes -c "\du"
```

### ¿No ves `frontend/public` en imagen Docker?
Revisa `.gitignore` y asegúrate de que `frontend/public/` esté trackeado. El backend no depende de esto, pero el frontend sí para servir `index.html` si se construye dentro del contenedor.

## 📝 Notas Importantes

1. **Datos de prueba**: Las tablas se crean vacías
2. **Backup**: Siempre haz backup antes de usar `drop` o `reset`
3. **Desarrollo**: Este enfoque es perfecto para desarrollo
4. **Producción**: Considera migrar a Alembic para producción

## 🎯 Próximos Pasos

Cuando el proyecto crezca, considera:
1. Migrar a Alembic para control de versiones
2. Implementar seeds de datos iniciales
3. Agregar índices para performance
4. Configurar backups automáticos
