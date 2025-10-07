-- Inicialización de la base de datos RetroFit
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    edad INTEGER,
    peso FLOAT,
    altura FLOAT,
    genero VARCHAR(20),
    nivel_condicion_fisica VARCHAR(50),
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255),
    proveedor VARCHAR(50) DEFAULT 'local',
    TFA_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de puntos
CREATE TABLE IF NOT EXISTS puntos (
    id_puntos SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de definiciones de logros
CREATE TABLE IF NOT EXISTS logro_definicion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    regla_tipo VARCHAR(50) NOT NULL,
    regla_valor INTEGER NOT NULL,
    puntos_recompensa INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logros de usuarios
CREATE TABLE IF NOT EXISTS logro (
    id_logro SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    logro_definicion_id INTEGER NOT NULL REFERENCES logro_definicion(id) ON DELETE CASCADE,
    fecha_obtenido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, logro_definicion_id)
);

-- Tabla de actividades
CREATE TABLE IF NOT EXISTS actividad (
    id_actividad SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    duracion INTEGER NOT NULL,
    intensidad VARCHAR(20) NOT NULL,
    puntos_ganados INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos logros de ejemplo
INSERT INTO logro_definicion (nombre, descripcion, regla_tipo, regla_valor, puntos_recompensa) VALUES
('Primera Actividad', 'Completa tu primera actividad física', 'actividades_totales', 1, 50),
('Atleta Principiante', 'Completa 5 actividades físicas', 'actividades_totales', 5, 100),
('Guerrero del Fitness', 'Completa 10 actividades físicas', 'actividades_totales', 10, 200),
('Maratonista', 'Completa 25 actividades físicas', 'actividades_totales', 25, 500),
('Campeón de Puntos', 'Alcanza 1000 puntos totales', 'puntos_totales', 1000, 300);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_puntos_usuario ON puntos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_logro_usuario ON logro(id_usuario);
CREATE INDEX IF NOT EXISTS idx_actividad_usuario ON actividad(id_usuario);
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad(fecha);

-- Usuario de ejemplo (password: "password123")
-- Hash generado con bcrypt
INSERT INTO usuario (nombre, correo, contraseña) VALUES 
('Admin User', 'admin@retrofit.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdqJW1/OmNE9y')
ON CONFLICT (correo) DO NOTHING;