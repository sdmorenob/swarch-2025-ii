# Contributing to TaskNotes

¡Gracias por tu interés en contribuir a TaskNotes! Este documento proporciona pautas y información sobre cómo contribuir al proyecto.

## Código de Conducta

Al participar en este proyecto, te comprometes a mantener un ambiente respetuoso y colaborativo. Por favor, sé considerado con otros contribuyentes.

## Cómo Contribuir

### Reportar Bugs

1. **Verifica que el bug no haya sido reportado antes** buscando en los issues existentes.
2. **Crea un nuevo issue** con la etiqueta "bug" si no existe uno similar.
3. **Incluye información detallada:**
   - Descripción clara del problema
   - Pasos para reproducir el bug
   - Comportamiento esperado vs. comportamiento actual
   - Screenshots si es aplicable
   - Información del entorno (OS, versión del navegador, etc.)

### Sugerir Mejoras

1. **Verifica que la mejora no haya sido sugerida antes** en los issues.
2. **Crea un nuevo issue** con la etiqueta "enhancement".
3. **Describe claramente:**
   - El problema que resuelve la mejora
   - La solución propuesta
   - Alternativas consideradas
   - Impacto en usuarios existentes

### Contribuir con Código

#### Configuración del Entorno de Desarrollo

1. **Fork el repositorio** y clónalo localmente:
   ```bash
   git clone https://github.com/tu-usuario/TaskNotes.git
   cd TaskNotes
   ```

2. **Configura el entorno de desarrollo:**
   ```bash
   # Instalar dependencias del frontend
   cd frontend
   npm install
   
   # Instalar dependencias del backend
   cd ../backend
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   
   # Instalar dependencias del search service
   cd ../search-service
   go mod download
   ```

3. **Configura las variables de entorno:**
   ```bash
   cp backend/.env.example backend/.env
   cp search-service/.env.example search-service/.env
   ```

4. **Ejecuta los servicios en modo desarrollo:**
   ```bash
   docker-compose up postgres mongodb redis
   ```

#### Proceso de Desarrollo

1. **Crea una rama para tu feature:**
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

2. **Realiza tus cambios siguiendo las convenciones de código:**
   - **Frontend (TypeScript/React):**
     - Usa ESLint y Prettier
     - Sigue las convenciones de naming de React
     - Escribe tests para componentes nuevos
   
   - **Backend (Python/FastAPI):**
     - Usa Black para formateo
     - Sigue PEP 8
     - Escribe tests para nuevos endpoints
     - Documenta APIs con docstrings
   
   - **Search Service (Go):**
     - Usa gofmt para formateo
     - Sigue las convenciones de Go
     - Escribe tests unitarios

3. **Ejecuta los tests:**
   ```bash
   # Frontend tests
   cd frontend
   npm test
   
   # Backend tests
   cd backend
   pytest
   
   # Go tests
   cd search-service
   go test ./...
   ```

4. **Ejecuta los linters:**
   ```bash
   # Frontend
   cd frontend
   npm run lint
   
   # Backend
   cd backend
   black .
   isort .
   mypy .
   
   # Go
   cd search-service
   golint ./...
   go vet ./...
   ```

5. **Commit tus cambios:**
   ```bash
   git add .
   git commit -m "feat: descripción clara del cambio"
   ```

#### Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato (no afectan funcionalidad)
- `refactor:` refactorización de código
- `test:` agregar o modificar tests
- `chore:` tareas de mantenimiento

#### Pull Request

1. **Push tu rama:**
   ```bash
   git push origin feature/nombre-descriptivo
   ```

2. **Crea un Pull Request** con:
   - Título descriptivo
   - Descripción detallada de los cambios
   - Referencias a issues relacionados
   - Screenshots si hay cambios visuales
   - Lista de verificación completada

3. **Asegúrate de que:**
   - Todos los tests pasan
   - El código sigue las convenciones del proyecto
   - La documentación está actualizada
   - No hay conflictos de merge

## Estructura del Proyecto

```
TaskNotes/
├── frontend/                 # React TypeScript
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilidades
│   └── tests/               # Tests del frontend
├── backend/                  # FastAPI Python
│   ├── app/
│   │   ├── core/           # Configuración
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── routers/        # Endpoints API
│   │   └── services/       # Lógica de negocio
│   └── tests/              # Tests del backend
└── search-service/          # Go microservice
    ├── handlers/           # HTTP handlers
    ├── models/             # Estructuras de datos
    ├── services/           # Lógica de búsqueda
    └── tests/              # Tests del microservicio
```

## Estándares de Código

### Frontend (TypeScript/React)

- Usa TypeScript estricto
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Manejo de estado con Context API
- Tests con Jest y React Testing Library

### Backend (Python/FastAPI)

- Type hints en todas las funciones
- Async/await para operaciones I/O
- Pydantic para validación de datos
- SQLAlchemy para ORM
- Tests con pytest

### Search Service (Go)

- Interfaces para abstracciones
- Error handling explícito
- Contextos para cancelación
- Tests con testing package estándar

## Documentación

- Actualiza la documentación cuando agregues nuevas funcionalidades
- Incluye ejemplos de uso en docstrings
- Mantén el README.md actualizado
- Documenta cambios en la API en ARCHITECTURE.md

## Preguntas

Si tienes preguntas sobre cómo contribuir, puedes:

1. Crear un issue con la etiqueta "question"
2. Revisar issues existentes con respuestas similares
3. Contactar a los mantenedores del proyecto

¡Gracias por contribuir a TaskNotes! 🚀