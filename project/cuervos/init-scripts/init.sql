-- Initialize PostgreSQL database for TaskNotes
-- -------------------------------------------------
-- Este script se ejecuta automáticamente cuando el contenedor de PostgreSQL
-- inicia por primera vez (montado en /docker-entrypoint-initdb.d/).
-- Su objetivo es preparar extensiones, permisos y (opcionalmente) datos semilla.

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Índices podrían crearse desde migraciones si se adopta Alembic a futuro.

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON DATABASE tasknotes TO "user";

-- Puedes agregar datos iniciales aquí si lo necesitas.
-- Por ejemplo, categorías por defecto o usuarios del sistema.

-- Example: Insert default categories
-- INSERT INTO categories (name, description) VALUES 
-- ('Work', 'Work-related tasks'),
-- ('Personal', 'Personal tasks'),
-- ('Study', 'Study and learning tasks');

-- Nota: En este proyecto, las tablas las crea SQLAlchemy directamente en el
--       arranque (prototipo). Si migras a Alembic, puedes mover aquí semillas
--       y la creación de índices.