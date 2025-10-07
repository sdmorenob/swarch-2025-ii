## Memoria técnica: Categorías y Etiquetas (Estado, Errores y Verificación)

Este documento consolida el historial de errores y decisiones técnicas alrededor del manejo de categorías y etiquetas para Tareas y Notas. Sirve como guía de diagnóstico y verificación.

### 1) Resumen del problema
- Al crear/editar, no aparecen errores de validación en UI, pero en algunos casos los cambios no se reflejan realmente en la persistencia (categoría/etiquetas no quedan asociadas o no se expanden en la respuesta).
- Inicialmente hubo múltiples 422 por desajustes de tipos (IDs numéricos vs strings) y estructuras distintas entre frontend y backend.

### 2) Síntomas observados
- 422 Unprocessable Entity (Pydantic):
  - `category_id` y/o `tag_ids[*]` “Input should be a valid string” cuando el frontend enviaba números.
- TypeErrors en frontend al renderizar chips porque las respuestas variaban entre nombre/id/objeto:
  - `.map` sobre `undefined` en `NoteItem.tsx` / `TaskItem.tsx`.
  - `.replace` sobre `status` `undefined` en `DashboardPage.tsx`.
- UI mostraba chips sin color o con datos inconsistentes.

### 3) Causas raíz identificadas
- Contrato inconsistente entre FE y BE:
  - FE enviaba IDs numéricos; BE esperaba strings (Pydantic schemas).
  - BE devolvía en tareas `category` y `tags` como nombres simples; FE esperaba objetos con `{ id, name, color }`.
- Normalización ausente en selects del FE: algunos `MenuItem value` eran numéricos → terminaban viajando como `number`.
- Para Notas (Mongo), `expand_note_data` requería `category_id`/`tag_ids` como strings; si llegaban números o strings vacíos, la expansión fallaba.

### 4) Cambios aplicados (última iteración)
- Backend `tasks.py`:
  - Nueva función `serialize_task(task)` que devuelve siempre:
    - `category: { id, name, color } | null`
    - `tags: [{ id, name, color }]`
  - `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}` usan `serialize_task`.
  - Al crear/actualizar: convierte `category_id` y `tag_ids` a `int` para asociar con `Category`/`Tag` (PostgreSQL).
- Frontend Tasks:
  - `TaskList.tsx` y `TaskItem.tsx` normalizan SIEMPRE a strings:
    - `category_id = String(value)`
    - `tag_ids = value.map(String)`
  - Comparaciones en selects y renderValue con `String(id)`.
  - Toggle completar envía solo `{ completed }`.
- Frontend Types:
  - `Task.tags` y `Note.tags` incluyen `color`.
- Notas (Mongo):
  - En `notes.py`: manejo de `category_id`/`tag_ids` vacíos, y `expand_note_data` para anexar objetos `{ id, name, color }` desde PostgreSQL.

### 5) Estado actual esperado
- Crear/editar Tareas:
  - Peticiones envían strings para IDs.
  - BE asocia correctamente `category_id` y relación N‑a‑N `task_tags`.
  - Respuesta incluye objetos con color; UI renderiza chips coloreados.
- Crear/editar Notas:
  - Se guardan `category_id` y `tag_ids` (strings) en Mongo.
  - Respuesta expande `category` y `tags` con color.

Si la UI muestra cambios pero al refrescar no persisten:
  - Sospechar de la escritura en DB (commit) o del shape en respuestas que actualizan estado en el FE.

### 6) Plan de verificación (paso a paso)
1. Ver FE envía strings
   - Abrir DevTools > Network al crear/editar tarea/nota.
   - Request JSON debe tener:
     - `category_id: "1"` (string o ausente)
     - `tag_ids: ["4", "5"]` (o ausente)
2. Ver BE responde con objetos expandidos
   - Respuesta Tarea (`/tasks` o `/tasks/{id}`):
     ```json
     {
       "category": {"id":"1","name":"Carro","color":"#1976d2"},
       "tags": [{"id":"4","name":"sgdfgd","color":"#ff9800"}]
     }
     ```
   - Respuesta Nota (`/notes` o `/notes/{id}`): igual formato para `category`/`tags`.
3. Ver persistencia en DB
   - PostgreSQL (tareas):
     - `SELECT id, title, category_id FROM tasks WHERE id = <ID>;`
     - `SELECT * FROM task_tags WHERE task_id = <ID>;`
   - MongoDB (notas):
     - `db.notes.find({ _id: ObjectId("...") }, { category_id:1, tag_ids:1 }).pretty()`
4. Ver eventos WS
   - Confirmar recepción de `task_created`/`task_updated`/`note_created` con payload coincidente con el guardado.

### 7) Reproducción de fallas conocidas
- Falla: 422 en creación/edición
  - Causa: IDs numéricos. Solución: asegurar `String(id)` en selects y al componer payload.
- Falla: chips sin color / estructura inesperada
  - Causa: BE devolvía nombres en lugar de objetos. Solución: `serialize_task` y expansión en notas.
- Falla: “no se guarda realmente”
  - Hipótesis A (Tareas): payload correcto pero relación `task.tags` no se persiste si IDs inválidos.
    - Verificar que `tag_ids` existentes correspondan a filas en `tags`.
  - Hipótesis B (Notas): `category_id`/`tag_ids` se guardan, pero UI sobrescribe con respuesta antigua por no refrescar lista tras `update`/`create`.
    - Solución: tras `update`, re‑leer el recurso (`getTask`/`getNote`) o actualizar desde evento WS.

### 8) Checklist de diagnóstico rápido
- [ ] FE envía strings para todos los IDs
- [ ] Respuestas traen `category` y `tags` como objetos (no strings)
- [ ] Postgres: `tasks.category_id` actualizado; `task_tags` contiene filas
- [ ] Mongo: `notes.category_id` y `tag_ids` actualizados
- [ ] Eventos WS recibidos con payload correcto

### 9) Acciones sugeridas si persiste “no guarda”
1. En `TaskItem.handleSave` y formularios de creación, ya se normaliza. Validar con Network.
2. En backend `tasks.py`, ya se hace `db.commit()` y `db.refresh()`. Ver logs al crear/actualizar: imprimir `category_id` aplicado y lista de `task.tags` (IDs) tras commit.
3. Añadir una verificación inmediata tras `create/update` en FE: volver a pedir el recurso (`getTask`/`getNote`) y sustituir en estado. Esto ya se hace en `TaskItem` para update.
4. Si falta color: verificar que modelos `Category.color` y `Tag.color` estén poblados.

### 10) Referencias de archivos
- Backend
  - `backend/app/routers/tasks.py` (serialización unificada y asociación de IDs)
  - `backend/app/routers/notes.py` (expansión; manejo de strings vacíos)
  - `backend/app/models/postgres_models.py` (modelos `Task`, `Tag`, `Category`)
- Frontend
  - `frontend/src/components/TaskList.tsx` (formularios; normalización de IDs)
  - `frontend/src/components/TaskItem.tsx` (edición; refresco posterior a update)
  - `frontend/src/types/index.ts` (tipos con `color`)

### 11) Futuras mejoras
- Validar existencia de `category_id`/`tag_ids` en BE y devolver 404 si no existen.
- Endpoint de lectura con include opcional (p. ej. `?expand=false`) para controlar expansión.
- Añadir pruebas de integración (FE ↔ BE) para asegurar contrato.


